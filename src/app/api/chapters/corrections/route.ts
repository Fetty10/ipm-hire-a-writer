export const dynamic = "force-dynamic";
// src/app/api/chapters/corrections/route.ts
// Student submits a correction request on a delivered chapter
// Routes to QC — QC handles it (with option to escalate to writer)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";

async function getQCWithFewestJobs(): Promise<string | null> {
  const qcStaff = await prisma.user.findMany({
    where: { role: Role.QC, isApproved: true, isSuspended: false },
    select: { id: true },
  });
  if (!qcStaff.length) return null;

  const counts = await Promise.all(
    qcStaff.map(async (s) => ({
      id:    s.id,
      count: await prisma.orderChapter.count({
        where: {
          routedToQcId: s.id,
          status:       { in: [ChapterStatus.QC_IN_PROGRESS] },
        },
      }),
    }))
  );
  counts.sort((a, b) => a.count - b.count);
  return counts[0]?.id ?? null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    chapterId,
    correctionRequest,   // student's written correction request
    supervisorNotesUrl,  // optional uploaded supervisor notes file URL
  } = await req.json();

  if (!chapterId || !correctionRequest) {
    return NextResponse.json(
      { error: "chapterId and correctionRequest are required." },
      { status: 400 }
    );
  }

  // Verify this chapter belongs to the student and is delivered
  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:     chapterId,
      status: ChapterStatus.DELIVERED,
      order:  { clientId: session.user.id },
    },
    include: {
      order: { select: { topic: true, clientId: true } },
    },
  });

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapter not found or not eligible for correction." },
      { status: 404 }
    );
  }

  // Assign to QC with fewest active jobs
  const qcId = await getQCWithFewestJobs();

  // Mark chapter as back in QC review (correction mode)
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:          ChapterStatus.QC_IN_PROGRESS,
      correctionNotes: correctionRequest,
      routedToQcId:    qcId || undefined,
      routedToQcAt:    new Date(),
      // Store supervisor notes URL in adminNotes temporarily
      adminNotes:      supervisorNotesUrl ? `supervisor_notes:${supervisorNotesUrl}` : null,
    },
  });

  // Notify QC
  if (qcId) {
    await prisma.notification.create({
      data: {
        userId:  qcId,
        orderId: chapter.orderId,
        title:   "Student Correction Request",
        message: `A student has requested a correction on ${chapter.chapterLabel} for "${chapter.order.topic}". Please log in to review and handle it.`,
        type:    "ACTION_REQUIRED",
      },
    });
  } else {
    // No QC available — alert admin
    const admins = await prisma.user.findMany({
      where: { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId:  a.id,
        orderId: chapter.orderId,
        title:   "⚠️ Correction Request — No QC Available",
        message: `Student correction for ${chapter.chapterLabel} on "${chapter.order.topic}" needs manual QC assignment.`,
        type:    "ALERT" as const,
      })),
    });
  }

  return NextResponse.json({
    success: true,
    message: "Correction request submitted. Our team will handle it shortly.",
  });
}
