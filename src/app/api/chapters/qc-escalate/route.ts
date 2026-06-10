export const dynamic = "force-dynamic";
// src/app/api/chapters/qc-escalate/route.ts
// QC sends a chapter back to the original writer/analyst with instructions
// Both QC notes AND student's correction request are visible to writer

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.QC) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    chapterId,
    escalationType,       // "corrections" | "section_rewrite" | "full_rewrite"
    instructionsForWriter,
  } = await req.json();

  if (!chapterId || !instructionsForWriter) {
    return NextResponse.json(
      { error: "chapterId and instructionsForWriter are required." },
      { status: 400 }
    );
  }

  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:     chapterId,
      status: { in: [ChapterStatus.QC_IN_PROGRESS, ChapterStatus.SUBMITTED] },
    },
    include: {
      order:      { select: { topic: true, clientId: true } },
      assignedTo: { select: { id: true, name: true, role: true } },
    },
  });

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapter not found or not in a state that can be escalated." },
      { status: 404 }
    );
  }

  const originalStaffId = chapter.assignedToId;
  if (!originalStaffId) {
    return NextResponse.json(
      { error: "No original staff member found for this chapter." },
      { status: 400 }
    );
  }

  const typeLabel: Record<string, string> = {
    corrections:      "specific corrections",
    section_rewrite:  "a section rewrite",
    full_rewrite:     "a full chapter rewrite",
  };

  // ── Mark chapter as back in progress ─────────────────────
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:         ChapterStatus.IN_PROGRESS,
      correctionNotes: instructionsForWriter,
      // Clear old QC fields so it needs to go through QC again
      qcFileUrl:      null,
      qcClearedAt:    null,
    },
  });

  // ── Notify writer/analyst ─────────────────────────────────
  await prisma.notification.create({
    data: {
      userId:  originalStaffId,
      orderId: chapter.orderId,
      title:   `${chapter.chapterLabel} — Correction Required`,
      message: `QC has reviewed your ${chapter.chapterLabel} for "${chapter.order.topic}" and requires ${
        typeLabel[escalationType] || "corrections"
      }. Please log in to see the detailed instructions and resubmit.`,
      type: "ACTION_REQUIRED",
    },
  });

  return NextResponse.json({
    success: true,
    message: `Chapter returned to ${chapter.assignedTo?.role?.toLowerCase() || "staff"} for ${
      typeLabel[escalationType] || "corrections"
    }.`,
  });
}
