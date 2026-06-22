export const dynamic = "force-dynamic";
// src/app/api/qc/jobs/route.ts
// Returns chapters assigned to QC — split by flow: checks or corrections

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.QC) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const flow   = searchParams.get("flow")   || "checks"; // "checks" | "corrections"
  const status = searchParams.get("status") || "pending"; // "pending" | "active" | "cleared"
  const search = searchParams.get("search") || "";

  // Checks flow: chapters routed for AI/plagiarism (Professional plan, first submission)
  // Corrections flow: chapters routed after student correction request (correctionNotes set)

  let statusFilter: ChapterStatus[] = [];
  let routingFilter: any = {};

  if (status === "pending") {
    // Pending = assigned to this QC, not yet started (no startedAt timestamp)
    statusFilter  = [ChapterStatus.QC_IN_PROGRESS];
    routingFilter = { routedToQcId: session.user.id, qcStartedAt: null } as any;
  }
  if (status === "active") {
    // Active = assigned to this QC and already started
    statusFilter  = [ChapterStatus.QC_IN_PROGRESS];
    routingFilter = { routedToQcId: session.user.id, qcStartedAt: { not: null } } as any;
  }
  if (status === "cleared") {
    statusFilter  = [ChapterStatus.QC_DONE, ChapterStatus.DELIVERED];
    routingFilter = { routedToQcId: session.user.id };
  }

  const page    = parseInt(searchParams.get("page") || "1");
  const perPage = status === "cleared" ? 15 : 50;

  const where = {
    ...routingFilter,
    status: { in: statusFilter },
    ...(flow === "corrections"
      ? { correctionNotes: { not: null } }
      : { correctionNotes: null }),
    ...(search
      ? { order: { topic: { contains: search, mode: "insensitive" } } }
      : {}),
  };

  const orderBy = status === "cleared"
    ? { qcClearedAt: "desc" as const }
    : { routedToQcAt: "asc" as const };

  const [chapters, total] = await Promise.all([
    prisma.orderChapter.findMany({
      where,
      include: {
        order: {
          select: {
            id:                      true,
            topic:                   true,
            department:              true,
            degreeGroup:             true,
            requiresPlagiarismCheck: true,
            requiresAiCheck:         true,
            specialInstructions:     true,
            guidelineFileUrl:        true,
            plan: { select: { planName: true } },
          },
        },
        assignedTo: { select: { id: true, role: true } },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.orderChapter.count({ where }),
  ]);

  const formatted = chapters.map((ch) => ({
    id:              ch.id,
    chapterNumber:   ch.chapterNumber,
    chapterLabel:    ch.chapterLabel,
    status:          ch.status,
    topic:           ch.order.topic,
    department:      ch.order.department,
    degreeGroup:     ch.order.degreeGroup,
    planName:        ch.order.plan.planName,
    requiresPlagiarism: ch.order.requiresPlagiarismCheck,
    requiresAI:         ch.order.requiresAiCheck,
    specialInstructions: ch.order.specialInstructions,
    guidelineFileUrl:    ch.order.guidelineFileUrl,
    submittedFileUrl:    ch.submittedFileUrl,
    deliveredFileUrl:    ch.deliveredFileUrl,
    correctionNotes:     ch.correctionNotes,
    adminNotes:          ch.adminNotes,   // may contain supervisor_notes URL
    qcClearedAt:         ch.qcClearedAt,
    routedToQcAt:        ch.routedToQcAt,
    qcStartedAt:         (ch as any).qcStartedAt || null,
    deadlineAt:          (ch as any).deadlineAt || null,
    originalStaffRole:   ch.assignedTo?.role || null,
    isUrgent:            (ch as any).isUrgent || false,
  }));

  return NextResponse.json({ success: true, data: formatted, total, page, pages: Math.ceil(total / perPage) });
}
