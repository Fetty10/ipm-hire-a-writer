export const dynamic = "force-dynamic";
// src/app/api/staff/jobs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const STATUS_GROUPS: Record<string, string[]> = {
  pending:   ["NOT_STARTED"],
  active:    ["IN_PROGRESS", "PRELIM_SUBMITTED"],
  delivered: ["SUBMITTED", "QC_IN_PROGRESS", "QC_DONE", "DELIVERED"],
  all:       ["NOT_STARTED","IN_PROGRESS","PRELIM_SUBMITTED","SUBMITTED","QC_IN_PROGRESS","QC_DONE","DELIVERED","CORRECTION_NEEDED"],
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status") || "pending";
  const search      = searchParams.get("search") || "";

  const statusFilter = STATUS_GROUPS[statusParam] || STATUS_GROUPS.pending;

  const chapters = await prisma.orderChapter.findMany({
    where: {
      assignedToId: session.user.id,
      status: { in: statusFilter as any[] },
      ...(search
        ? { order: { topic: { contains: search, mode: "insensitive" } } }
        : {}),
    },
    include: {
      order: {
        select: {
          id:                  true,
          topic:               true,
          department:          true,
          degreeGroup:         true,
          specialInstructions: true,
          adminNote:           true,
          guidelineFileUrl:    true,
          plan: { select: { planName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // For Chapter 3 & 4 (analyst jobs), also fetch the writer's prelim notes
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
            prelimSubmittedAt:  true,
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
        researchObjectives: ch.researchObjectives,
        researchQuestions:  ch.researchQuestions,
        hypotheses:         ch.hypotheses,
        scopeOfStudy:       ch.scopeOfStudy,
        prelimSubmittedAt:  ch.prelimSubmittedAt,
        submittedFileUrl:   ch.submittedFileUrl,
        deliveredFileUrl:   ch.deliveredFileUrl,
        writerNotes:        ch.writerNotes,
        correctionNotes:    ch.correctionNotes,
        createdAt:          ch.createdAt,
        submittedAt:        ch.submittedAt,
        deliveredAt:        ch.deliveredAt,
        topic:               ch.order.topic,
        department:          ch.order.department,
        degreeGroup:         ch.order.degreeGroup,
        specialInstructions: ch.order.specialInstructions, // student's original instructions
        adminNote:           ch.order.adminNote,           // admin's separate note
        guidelineFileUrl:    ch.order.guidelineFileUrl,
        planName:            ch.order.plan.planName,
        writerPrelimNotes,  // Chapter 1 prelim data for analyst context
      };
    })
  );

  return NextResponse.json({ success: true, data: enriched });
}
