export const dynamic = "force-dynamic";
// src/app/api/chapters/qc-escalate/route.ts
// QC sends a chapter back to the original writer/analyst with instructions
// Both QC notes AND student's correction request are visible to writer

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM   = "iProjectMaster <noreply@hire.iprojectmaster.com>";
const APP    = process.env.NEXTAUTH_URL || "https://hire.iprojectmaster.com";

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
      assignedTo: { select: { id: true, name: true, role: true, email: true } },
    },
  });

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapter not found or not in a state that can be escalated." },
      { status: 404 }
    );
  }

  const originalStaffId = chapter.assignedToId;
  if (!originalStaffId || !chapter.assignedTo) {
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
  const label = typeLabel[escalationType] || "corrections";

  // ── Mark chapter as back in progress, flag as an escalated correction ─
  // IMPORTANT: correctionNotes (student's original request) is preserved —
  // QC's own instructions go into a separate field so the writer/analyst
  // sees BOTH side by side.
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:            ChapterStatus.IN_PROGRESS,
      qcEscalationNotes: instructionsForWriter,
      isEscalatedCorrection: true,
      // Clear old QC fields so it needs to go through QC again
      qcFileUrl:      null,
      qcClearedAt:    null,
    } as any,
  });

  // ── Block withdrawals for this staff member until resolved ────────────
  await prisma.user.update({
    where: { id: originalStaffId },
    data:  { hasPendingCorrections: true } as any,
  });

  // ── Notify writer/analyst (in-app) ─────────────────────────
  await prisma.notification.create({
    data: {
      userId:  originalStaffId,
      orderId: chapter.orderId,
      title:   `🔧 ${chapter.chapterLabel} — Correction Required`,
      message: `QC has reviewed your ${chapter.chapterLabel} for "${chapter.order.topic}" and requires ${label}. Please log in to see the detailed instructions and resubmit. Note: withdrawals are paused until this is resolved.`,
      type: "ACTION_REQUIRED",
    },
  });

  // ── Notify writer/analyst (email) ──────────────────────────
  if (chapter.assignedTo.email) {
    try {
      const dashLink = chapter.assignedTo.role === "ANALYST"
        ? `${APP}/analyst/jobs/active`
        : `${APP}/writer/jobs/active`;

      await resend.emails.send({
        from: FROM,
        to:   chapter.assignedTo.email,
        subject: `🔧 Correction Required — ${chapter.chapterLabel}`,
        html: `
          <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:1.5rem;background:#fff;border-radius:14px;border:1px solid #FED7AA;">
            <h2 style="color:#9A3412;font-size:1.1rem;margin:0 0 .75rem;">🔧 QC Requires ${label}</h2>
            <p style="color:#5B7EA6;font-size:.85rem;line-height:1.6;">Hi ${chapter.assignedTo.name}, QC has reviewed <strong>${chapter.chapterLabel}</strong> for "${chapter.order.topic}" and it needs ${label} before it can be delivered.</p>
            <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:1rem;margin:1rem 0;">
              <p style="color:#9A3412;font-size:.8rem;font-weight:700;margin:0 0 .4rem;">QC's Instructions:</p>
              <p style="color:#7C2D12;font-size:.82rem;line-height:1.6;margin:0;">${instructionsForWriter}</p>
            </div>
            ${chapter.correctionNotes ? `
            <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;padding:1rem;margin:1rem 0;">
              <p style="color:#0369A1;font-size:.8rem;font-weight:700;margin:0 0 .4rem;">Student's Original Request:</p>
              <p style="color:#0C4A6E;font-size:.82rem;line-height:1.6;margin:0;">${chapter.correctionNotes}</p>
            </div>` : ""}
            <p style="color:#991B1B;font-size:.8rem;font-weight:600;line-height:1.6;">⚠️ Important: Your withdrawals are paused until this correction is completed and resubmitted.</p>
            <a href="${dashLink}" style="display:inline-block;margin-top:1rem;padding:.7rem 1.5rem;background:#38BDF8;color:#0C1A2E;font-weight:700;font-size:.85rem;border-radius:10px;text-decoration:none;">View & Resolve →</a>
          </div>
        `,
      });
    } catch (e) { console.error("[EMAIL] Escalation notify:", e); }
  }

  return NextResponse.json({
    success: true,
    message: `Chapter returned to ${chapter.assignedTo?.role?.toLowerCase() || "staff"} for ${label}. Staff notified via email and notification.`,
  });
}
