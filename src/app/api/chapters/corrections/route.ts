export const dynamic = "force-dynamic";
// src/app/api/chapters/corrections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chapterId, correctionRequest, supervisorNotesUrl } = await req.json();

  if (!chapterId || !correctionRequest) {
    return NextResponse.json(
      { error: "chapterId and correctionRequest are required." },
      { status: 400 }
    );
  }

  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:     chapterId,
      status: ChapterStatus.DELIVERED,
      order:  { clientId: session.user.id },
    },
    include: {
      order: {
        include: { plan: true, client: true },
      },
    },
  });

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapter not found or not eligible for correction." },
      { status: 404 }
    );
  }

  // ── Block Basic plan corrections ──────────────────────────────
  if (chapter.order.plan.planName === "BASIC") {
    return NextResponse.json(
      { error: "Your current plan (Basic) does not include free corrections. Please upgrade your plan by placing a new order." },
      { status: 403 }
    );
  }

  // Set QC_IN_PROGRESS but leave routedToQcId NULL
  // so it appears in QC Pending Corrections (not Active)
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:          ChapterStatus.QC_IN_PROGRESS,
      correctionNotes: correctionRequest,
      routedToQcId:    null,
      routedToQcAt:    new Date(),
      adminNotes:      supervisorNotesUrl ? `supervisor_notes:${supervisorNotesUrl}` : null,
    },
  });

  // Notify all QC staff
  const qcStaff = await prisma.user.findMany({
    where: { role: Role.QC, isApproved: true, isSuspended: false },
    select: { id: true },
  });

  if (qcStaff.length > 0) {
    await prisma.notification.createMany({
      data: qcStaff.map(qc => ({
        userId:  qc.id,
        orderId: chapter.orderId,
        title:   "Student Correction Request",
        message: `A student has requested a correction on ${chapter.chapterLabel} for "${chapter.order.topic}". Log in to review and handle it.`,
        type:    "ACTION_REQUIRED" as const,
      })),
    });
  } else {
    const admins = await prisma.user.findMany({
      where: { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId:  a.id,
        orderId: chapter.orderId,
        title:   "⚠️ Correction Request — No QC Available",
        message: `Student correction for ${chapter.chapterLabel} on "${chapter.order.topic}" needs manual QC assignment.`,
        type:    "ALERT" as const,
      })),
    });
  }

  // Notify student that correction was received
  await prisma.notification.create({
    data: {
      userId:  session.user.id,
      orderId: chapter.orderId,
      title:   "Correction Request Received",
      message: `Your correction request for ${chapter.chapterLabel} has been received. Our QC team will handle it shortly.`,
      type:    "INFO",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Correction request submitted. Our QC team will handle it shortly.",
  });
}
