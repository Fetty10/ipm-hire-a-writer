export const dynamic = "force-dynamic";
// src/app/api/chapters/submit/route.ts
// Called when a writer/analyst submits a completed chapter
// Flow:
//   Professional plan → route to QC
//   Other plans       → deliver directly to student + create earning

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, PlanName, Role } from "@prisma/client";
import { routeChapterToQC, deliverChapterToClient } from "@/lib/assignment";
import { sendChapterDeliveredEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (![Role.WRITER, Role.ANALYST].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    chapterId,
    fileUrl,
    writerNotes,
    // Chapter 1 prelim fields
    researchObjectives,
    researchQuestions,
    hypotheses,
    scopeOfStudy,
  } = body;

  if (!chapterId || !fileUrl) {
    return NextResponse.json(
      { error: "chapterId and fileUrl are required." },
      { status: 400 }
    );
  }

  // Fetch and verify ownership
  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:           chapterId,
      assignedToId: session.user.id,
      status:       { in: [ChapterStatus.IN_PROGRESS, ChapterStatus.PRELIM_SUBMITTED] },
    },
    include: {
      order: {
        include: {
          plan:   true,
          client: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapter not found or not in a submittable state." },
      { status: 404 }
    );
  }

  // ── Chapter 1: validate prelim fields ────────────────────
  if (chapter.requiresPrelim) {
    // If prelim not yet submitted, require all 4 fields
    if (!chapter.prelimSubmittedAt) {
      if (!researchObjectives || !researchQuestions || !hypotheses || !scopeOfStudy) {
        return NextResponse.json(
          {
            error:
              "Chapter 1 requires Research Objectives, Research Questions, Hypotheses and Scope of Study before submission.",
          },
          { status: 400 }
        );
      }
    }
  }

  const isProfessional =
    chapter.order.plan.planName === PlanName.PROFESSIONAL ||
    chapter.order.plan.planName === PlanName.PHD_PROFESSIONAL;

  // ── Update chapter with submitted file + prelim data ─────
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:          ChapterStatus.SUBMITTED,
      submittedFileUrl: fileUrl,
      submittedAt:      new Date(),
      writerNotes:      writerNotes || null,
      // Save prelim fields if provided
      ...(researchObjectives ? { researchObjectives } : {}),
      ...(researchQuestions  ? { researchQuestions  } : {}),
      ...(hypotheses         ? { hypotheses         } : {}),
      ...(scopeOfStudy       ? { scopeOfStudy       } : {}),
      ...(researchObjectives ? { prelimSubmittedAt: new Date() } : {}),
    },
  });

  // ── Calculate staff earning for this chapter ─────────────
  const payRate = await prisma.payRate.findFirst({
    where: {
      role:        role === Role.WRITER ? "WRITER" : "ANALYST",
      degreeGroup: chapter.order.degreeGroup,
      planName:    chapter.order.plan.planName,
    },
  });

  const earnAmount = payRate?.amountKobo ?? 0;

  if (earnAmount > 0) {
    await prisma.earning.create({
      data: {
        userId:         session.user.id,
        orderChapterId: chapterId,
        amountKobo:     earnAmount,
        status:         "PENDING", // becomes AVAILABLE after delivery
      },
    });
  }

  // ── Route to QC or deliver directly ──────────────────────
  if (isProfessional) {
    // Professional plan → always goes to QC first
    await routeChapterToQC(chapterId);
    return NextResponse.json({
      success: true,
      message: "Chapter submitted and routed to QC for plagiarism/AI check.",
      routedToQC: true,
    });
  } else {
    // Basic / Standard → deliver directly to student
    await deliverChapterToClient(chapterId, fileUrl);

    // Send email to student
    await sendChapterDeliveredEmail({
      to:           chapter.order.client.email,
      name:         chapter.order.client.name,
      topic:        chapter.order.topic,
      chapterLabel: chapter.chapterLabel,
      orderId:      chapter.orderId,
    });

    return NextResponse.json({
      success: true,
      message: "Chapter submitted and delivered to student.",
      routedToQC: false,
    });
  }
}
