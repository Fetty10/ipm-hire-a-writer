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
import { sendChapterDeliveredEmail, sendPrelimReadyEmail } from "@/lib/email";

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
      if (!researchObjectives || !hypotheses || !scopeOfStudy) {
        return NextResponse.json(
          {
            error:
              "Chapter 1 requires Research Objectives, Hypotheses and Scope of Study before submission.",
          },
          { status: 400 }
        );
      }
    }
  }

  // Other services (non-project) skip QC by default UNLESS the student
  // explicitly added the Plagiarism/AI Check add-on at order time.
  const isOtherService = chapter.order.serviceType !== "HIRE_WRITER" && !!chapter.order.serviceType;
  const otherServiceNeedsQC = isOtherService && (
    chapter.order.requiresPlagiarismCheck || chapter.order.requiresAiCheck
  );
  const isProfessional = !isOtherService && (
    chapter.order.plan.planName === PlanName.PROFESSIONAL ||
    chapter.order.plan.planName === PlanName.PHD_PROFESSIONAL
  );
  const goesToQC = isProfessional || otherServiceNeedsQC;

  // ── Update chapter with submitted file + prelim data ─────
  const wasEscalated = (chapter as any).isEscalatedCorrection;

  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:          ChapterStatus.SUBMITTED,
      submittedFileUrl: fileUrl,
      submittedAt:      new Date(),
      writerNotes:      writerNotes || null,
      isEscalatedCorrection: false, // no longer "with writer" — back with QC for re-check
      // Save prelim fields if provided
      ...(researchObjectives ? { researchObjectives } : {}),
      ...(hypotheses         ? { hypotheses         } : {}),
      ...(scopeOfStudy       ? { scopeOfStudy       } : {}),
      ...(researchObjectives ? { prelimSubmittedAt: new Date() } : {}),
    } as any,
  });

  // ── If this resolved an escalated correction, check if staff has any
  // other pending corrections left — if not, unlock withdrawals ──────
  if (wasEscalated) {
    const stillPending = await prisma.orderChapter.count({
      where: {
        assignedToId: session.user.id,
        isEscalatedCorrection: true,
      } as any,
    });
    if (stillPending === 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data:  { hasPendingCorrections: false } as any,
      });
    }
  }

  // ── Notify analysts if Chapter 1 prelim fields just submitted ──
  if (chapter.chapterNumber === 1 && researchObjectives && !chapter.prelimSubmittedAt) {
    const analysts = await prisma.orderChapter.findMany({
      where: {
        orderId:      chapter.orderId,
        chapterNumber: { in: [3, 4] },
        assignedTo:   { role: Role.ANALYST },
      },
      include: { assignedTo: { select: { email: true, name: true } } },
    });
    const notifiedAnalysts = new Set<string>();
    for (const ch of analysts) {
      if (ch.assignedTo && !notifiedAnalysts.has(ch.assignedTo.email)) {
        notifiedAnalysts.add(ch.assignedTo.email);
        try {
          await sendPrelimReadyEmail({
            to:                 ch.assignedTo.email,
            name:               ch.assignedTo.name,
            topic:              chapter.order.topic,
            researchObjectives: researchObjectives!,
            hypotheses:         hypotheses!,
            scopeOfStudy:       scopeOfStudy!,
          });
        } catch (e) { console.error("[EMAIL] Prelim ready:", e); }
      }
    }
  }

  // ── Calculate staff earning for this chapter ─────────────
  let earnAmount = 0;

  if (isOtherService) {
    // For flat services, use pay rate from OtherService table
    const svcValue = {
      PROPOSAL_SEMINAR:      "seminar",
      JOURNAL_WRITING:       "journal",
      JOURNAL_SOURCING:      "journal_sourcing",
      TOPIC_SUGGESTION:      "topic",
      CASE_STUDY_ADJUSTMENT: "case_study",
      COMPLETE_PROJECT:      "project",
    }[chapter.order.serviceType] || chapter.order.serviceType?.toLowerCase();

    const svc = await (prisma as any).otherService.findFirst({
      where: { value: svcValue },
    });

    if (svc) {
      earnAmount = svc.writerPayKobo || 0; // other services always go to writer
    }
  } else {
    // For project chapters, use PayRate table
    const payRate = await prisma.payRate.findFirst({
      where: {
        role:        role === Role.WRITER ? "WRITER" : "ANALYST",
        degreeGroup: chapter.order.degreeGroup,
        planName:    chapter.order.plan.planName,
      },
    });
    earnAmount = payRate?.amountKobo ?? 0;
  }

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
  if (goesToQC) {
    // Professional plan, or other service with plagiarism/AI add-on → goes to QC first
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
