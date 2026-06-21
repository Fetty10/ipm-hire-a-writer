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
      status:          ChapterStatus.QC_DONE,
      qcFileUrl:       clearedFileUrl,
      qcClearedAt:     new Date(),
      adminNotes:      qcNotes || null,
      plagiarismScore: plagiarismScore != null ? parseInt(plagiarismScore) : null,
      aiScore:         aiScore != null ? parseInt(aiScore) : null,
      correctionNotes:   null, // resolved — clear so it doesn't show again
      qcEscalationNotes: null,
    } as any,
  });

  // ── Create QC earning ─────────────────────────────────────
  const isOtherServiceOrder = chapter.order.serviceType !== "HIRE_WRITER" && !!chapter.order.serviceType;

  let qcEarnAmount = 0;

  if (isOtherServiceOrder) {
    // Flat service — use the QC check pay rate set on OtherService
    const svcValueMap: Record<string,string> = {
      PROPOSAL_SEMINAR: "seminar",
      JOURNAL_WRITING:  "journal",
      JOURNAL_SOURCING: "journal_sourcing",
      TOPIC_SUGGESTION: "topic",
      HIRE_WRITER:      "assignment",
    };
    const svcValue = svcValueMap[chapter.order.serviceType] || chapter.order.serviceType?.toLowerCase();
    const svc = await (prisma as any).otherService.findFirst({ where: { value: svcValue } });
    qcEarnAmount = svc?.qcCheckPayKobo || 0;
  } else {
    // Project chapter — use the regular PayRate table
    const qcRate = await prisma.payRate.findFirst({
      where: {
        role:        "QC",
        degreeGroup: chapter.order.degreeGroup,
        planName:    chapter.order.plan.planName,
      },
    });
    qcEarnAmount = qcRate?.amountKobo || 0;
  }

  if (qcEarnAmount > 0) {
    await prisma.earning.create({
      data: {
        userId:         session.user.id,
        orderChapterId: chapterId,
        amountKobo:     qcEarnAmount,
        status:         "PENDING",
        category:       "CHAPTER",
      } as any,
    });
  }

  // ── Deliver to student ────────────────────────────────────
  await deliverChapterToClient(chapterId, clearedFileUrl);

  // ── Extra footnote pay for dedicated QC on exception departments ─
  const exceptionDepts = await (prisma as any).exceptionDepartment.findMany({
    where: { dedicatedQcId: session.user.id, footnotePayKobo: { gt: 0 } },
  });

  if (exceptionDepts.length > 0) {
    const dept = chapter.order.department?.toLowerCase().trim() || "";
    const hasFootnote = exceptionDepts.some((d: any) => {
      const exc = d.name.toLowerCase().trim();
      return dept.includes(exc) || exc.includes(dept);
    });

    if (hasFootnote) {
      const footnotePay = exceptionDepts.find((d: any) => {
        const exc = d.name.toLowerCase().trim();
        return dept.includes(exc) || exc.includes(dept);
      })?.footnotePayKobo || 0;

      if (footnotePay > 0) {
        await prisma.earning.create({
          data: {
            userId:         session.user.id,
            orderChapterId: chapterId,
            amountKobo:     footnotePay,
            status:         "AVAILABLE", // paid immediately on clear
            availableAt:    new Date(),
            category:       "FOOTNOTE",
          } as any,
        });
      }
    }
  }

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
