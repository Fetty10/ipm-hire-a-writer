export const dynamic = "force-dynamic";
// src/app/api/chapters/corrections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";
import { getNextQCForCorrectionRoundRobin } from "@/lib/assignment";
import { sendQCCheckAssignedEmail } from "@/lib/email";

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

  // ── Block Basic plan corrections — project orders only ──────
  const isOtherServiceOrder = chapter.order.serviceType !== "HIRE_WRITER" && !!chapter.order.serviceType;
  if (!isOtherServiceOrder && chapter.order.plan.planName === "BASIC") {
    return NextResponse.json(
      { error: "Your current plan (Basic) does not include free corrections. Please upgrade your plan by placing a new order." },
      { status: 403 }
    );
  }

  // ── Assign via STRICT ROUND-ROBIN ────────────────────────────
  // Corrections rotate equally — Peter, Timothy, Peter, Timothy...
  // regardless of how many active jobs each currently has.
  const qcUserId = await getNextQCForCorrectionRoundRobin();

  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:          ChapterStatus.QC_IN_PROGRESS,
      correctionNotes: correctionRequest,
      routedToQcId:    qcUserId,
      routedToQcAt:    new Date(),
      adminNotes:      supervisorNotesUrl ? `supervisor_notes:${supervisorNotesUrl}` : null,
    },
  });

  if (qcUserId) {
    const qc = await prisma.user.findUnique({
      where:  { id: qcUserId },
      select: { id: true, name: true, email: true },
    });

    if (qc) {
      await prisma.notification.create({
        data: {
          userId:  qc.id,
          orderId: chapter.orderId,
          title:   "Correction Request Assigned to You",
          message: `A student has requested a correction on ${chapter.chapterLabel} for "${chapter.order.topic}". Log in to your Pending Corrections to handle it.`,
          type:    "ACTION_REQUIRED",
        },
      });

      try {
        await sendQCCheckAssignedEmail({
          to:           qc.email,
          name:         qc.name,
          topic:        chapter.order.topic,
          chapterLabel: chapter.chapterLabel,
          checks:       ["Correction Request"],
        });
      } catch (e) { console.error("[EMAIL] Correction assigned:", e); }
    }
  } else {
    // No QC staff exist at all — fall back to admin notification
    const admins = await prisma.user.findMany({
      where: { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
      select: { id: true },
    });
    if (admins.length > 0) {
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
