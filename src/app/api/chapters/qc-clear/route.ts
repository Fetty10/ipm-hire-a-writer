// src/app/api/chapters/qc-clear/route.ts
// QC clears a chapter after plagiarism/AI checks → delivers to student
// Also handles correction clearances (student correction flow)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";
import { deliverChapterToClient } from "@/lib/assignment";
import { sendChapterDeliveredEmail, sendCorrectionReadyEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.QC) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    chapterId,
    clearedFileUrl,
    plagiarismScore,
    aiScore,
    qcNotes,
    isCorrection = false, // true when clearing a student correction
  } = await req.json();

  if (!chapterId || !clearedFileUrl) {
    return NextResponse.json(
      { error: "chapterId and clearedFileUrl are required." },
      { status: 400 }
    );
  }

  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:     chapterId,
      status: {
        in: [ChapterStatus.QC_IN_PROGRESS],
      },
    },
    include: {
      order: {
        include: {
          client: { select: { id: true, name: true, email: true } },
          plan:   { select: { planName: true } },
        },
      },
    },
  });

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapter not found or not in QC review." },
      { status: 404 }
    );
  }

  // ── Mark QC done ──────────────────────────────────────────
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:      ChapterStatus.QC_DONE,
      qcFileUrl:   clearedFileUrl,
      qcClearedAt: new Date(),
      adminNotes:  qcNotes || null,
    },
  });

  // ── Create QC earning ─────────────────────────────────────
  const qcRate = await prisma.payRate.findFirst({
    where: {
      role:        "QC",
      degreeGroup: chapter.order.degreeGroup,
      planName:    chapter.order.plan.planName,
    },
  });

  if (qcRate?.amountKobo) {
    await prisma.earning.create({
      data: {
        userId:         session.user.id,
        orderChapterId: chapterId,
        amountKobo:     qcRate.amountKobo,
        status:         "PENDING",
      },
    });
  }

  // ── Deliver to student ────────────────────────────────────
  await deliverChapterToClient(chapterId, clearedFileUrl);

  // ── Send email ────────────────────────────────────────────
  if (isCorrection) {
    await sendCorrectionReadyEmail({
      to:           chapter.order.client.email,
      name:         chapter.order.client.name,
      topic:        chapter.order.topic,
      chapterLabel: chapter.chapterLabel,
    });
  } else {
    await sendChapterDeliveredEmail({
      to:           chapter.order.client.email,
      name:         chapter.order.client.name,
      topic:        chapter.order.topic,
      chapterLabel: chapter.chapterLabel,
      orderId:      chapter.orderId,
    });
  }

  return NextResponse.json({
    success: true,
    message: "Chapter cleared and delivered to student.",
  });
}
