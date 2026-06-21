export const dynamic = "force-dynamic";
// src/app/api/staff/jobs/route.ts
// Returns all chapters assigned to the currently logged-in staff member
// Filtered by status: pending | active | delivered | all

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";

const STATUS_GROUPS = {
  pending:   [ChapterStatus.NOT_STARTED],
  active:    [ChapterStatus.IN_PROGRESS, ChapterStatus.PRELIM_SUBMITTED],
  qc:        [ChapterStatus.QC_IN_PROGRESS],
  delivered: [ChapterStatus.SUBMITTED, ChapterStatus.QC_IN_PROGRESS, ChapterStatus.QC_DONE, ChapterStatus.DELIVERED],
  all:       Object.values(ChapterStatus),
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (![Role.WRITER, Role.ANALYST, Role.QC].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filter  = (searchParams.get("status") || "all") as keyof typeof STATUS_GROUPS;
  const search  = searchParams.get("search") || "";
  const page    = parseInt(searchParams.get("page") || "1");
  const perPage = filter === "delivered" ? 15 : 50; // paginate delivered tab

  const statuses = STATUS_GROUPS[filter] || STATUS_GROUPS.all;

  const where = {
    assignedToId: session.user.id,
    status:       { in: statuses },
    ...(search ? { order: { topic: { contains: search, mode: "insensitive" } } } : {}),
  };

  // Pending: oldest orders first, chapter number ascending (so Ch1 before Ch5)
  // Active: createdAt desc (most recently started first)
  // Delivered: most recently delivered first
  const orderBy: any = filter === "delivered"
    ? [{ deliveredAt: "desc" }]
    : filter === "pending"
    ? [{ order: { createdAt: "asc" } }, { chapterNumber: "asc" }]
    : [{ createdAt: "desc" }];

  const [chapters, total] = await Promise.all([
    prisma.orderChapter.findMany({
      where,
      include: {
        order: {
          select: {
            id:                  true,
            topic:               true,
            department:          true,
            degreeGroup:         true,
            specialInstructions: true,
            guidelineFileUrl:    true,
            requiresPlagiarismCheck: true,
            requiresAiCheck:     true,
            isExceptionDept:     true,
            createdAt:           true,
            plan: {
              select: {
                planName:    true, // used for deadline calculation only
                degreeGroup: true,
              },
            },
          },
        },
      },
      orderBy,
      skip:  (page - 1) * perPage,
      take:  perPage,
    }),
    prisma.orderChapter.count({ where }),
  ]);

  // For Chapter 3 & 4 (analyst jobs), also fetch the writer's prelim notes
  // from Chapter 1 of the same order — so analyst has context
  const enriched = await Promise.all(
    chapters.map(async (ch) => {
      let writerPrelimNotes = null;

      if (ch.chapterNumber === 3 || ch.chapterNumber === 4) {
        const ch1 = await prisma.orderChapter.findFirst({
          where:  { orderId: ch.orderId, chapterNumber: 1 },
          select: {
            researchObjectives: true,
            researchQuestions:  true,
            hypotheses:         true,
            scopeOfStudy:       true,
          },
        });
        writerPrelimNotes = ch1;
      }

      return {
        id:              ch.id,
        chapterNumber:   ch.chapterNumber,
        chapterLabel:    ch.chapterLabel,
        status:          ch.status,
        requiresPrelim:  ch.requiresPrelim,
        // Prelim fields
        researchObjectives: ch.researchObjectives,
        researchQuestions:  ch.researchQuestions,
        hypotheses:         ch.hypotheses,
        scopeOfStudy:       ch.scopeOfStudy,
        prelimSubmittedAt:  ch.prelimSubmittedAt,
        // File URLs
        submittedFileUrl:   ch.submittedFileUrl,
        deliveredFileUrl:   ch.deliveredFileUrl,
        writerNotes:        ch.writerNotes,
        correctionNotes:    ch.correctionNotes,
        // Dates
        createdAt:          ch.createdAt,
        submittedAt:        ch.submittedAt,
        deliveredAt:        ch.deliveredAt,
        deadlineAt:         (ch as any).deadlineAt || null,
        orderCreatedAt:     ch.order.createdAt,
        // QC status — helps writer see if QC has started or just received
        qcStarted:          !!ch.routedToQcId,
        // Order info (no student name/price)
        topic:               ch.order.topic,
        department:          ch.order.department,
        degreeGroup:         ch.order.degreeGroup,
        specialInstructions: ch.order.specialInstructions,
        guidelineFileUrl:    ch.order.guidelineFileUrl,
        planName:           ch.order.plan.planName, // for deadline calc only
        startedAt:          ch.startedAt || null,
        isUrgent:           (ch as any).isUrgent || false,
        // Analyst gets writer's prelim notes for context
        writerPrelimNotes,
      };
    })
  );

  return NextResponse.json({ success: true, data: enriched, total, page, pages: Math.ceil(total / perPage) });
}
