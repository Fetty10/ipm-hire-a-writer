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

  if (status === "pending") statusFilter = [ChapterStatus.NOT_STARTED];
  if (status === "active")  statusFilter = [ChapterStatus.QC_IN_PROGRESS];
  if (status === "cleared") statusFilter = [ChapterStatus.QC_DONE, ChapterStatus.DELIVERED];

  const chapters = await prisma.orderChapter.findMany({
    where: {
      routedToQcId: session.user.id,
      status:       { in: statusFilter },
      // Differentiate corrections from normal checks via correctionNotes
      ...(flow === "corrections"
        ? { correctionNotes: { not: null } }
        : { correctionNotes: null }),
      ...(search
        ? { order: { topic: { contains: search, mode: "insensitive" } } }
        : {}),
    },
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
          // No client info — QC should not see student name
        },
      },
      assignedTo: { select: { id: true, role: true } },
    },
    orderBy: { routedToQcAt: "asc" },
  });

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
    originalStaffRole:   ch.assignedTo?.role || null,
  }));

  return NextResponse.json({ success: true, data: formatted });
}
