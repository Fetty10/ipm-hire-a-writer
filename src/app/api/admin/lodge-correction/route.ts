export const dynamic = "force-dynamic";
// src/app/api/admin/lodge-correction/route.ts
// Admin lodges a manual correction job for a legacy client (not in the new system)
// Creates a placeholder order + chapter and routes directly to QC — no writer
// escalation since the original writer can't be traced.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM   = "iProjectMaster <noreply@hire.iprojectmaster.com>";
const APP    = process.env.NEXT_PUBLIC_APP_URL || "https://hire.iprojectmaster.com";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    studentName,       // legacy client's name
    studentEmail,      // optional — for delivery notification
    studentPhone,      // optional — WhatsApp for Lina
    topic,             // project topic
    chapterLabel,      // e.g. "Chapter 3" or "Full Project"
    degreeGroup,       // OND_HND_NCE | BSC_BED_BA | PGD_MSC_PHD | PHD
    department,        // e.g. "Business Administration"
    correctionRequest, // what needs to be corrected
    qcId,              // which QC staff to assign
    guidelineFileUrl,  // optional uploaded file (original work)
  } = await req.json();

  if (!studentName?.trim() || !topic?.trim() || !chapterLabel?.trim() || !degreeGroup || !correctionRequest?.trim() || !qcId) {
    return NextResponse.json({
      error: "studentName, topic, chapterLabel, degreeGroup, correctionRequest and qcId are all required.",
    }, { status: 400 });
  }

  const qc = await prisma.user.findUnique({
    where:  { id: qcId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!qc || qc.role !== Role.QC) {
    return NextResponse.json({ error: "Selected staff member is not a QC." }, { status: 400 });
  }

  // ── Find or create a placeholder student account ─────────
  // We look for an existing CLIENT account with the same email (if provided),
  // otherwise create a minimal placeholder so the order has a valid clientId.
  let student = studentEmail
    ? await prisma.user.findFirst({ where: { email: studentEmail.trim(), role: Role.CLIENT } })
    : null;

  if (!student) {
    // Create a placeholder — password is randomised and unusable (they'd need
    // to register/reset to actually log in)
    const bcrypt = await import("bcryptjs");
    const hash   = await bcrypt.hash(Math.random().toString(36), 10);
    student = await prisma.user.create({
      data: {
        name:     studentName.trim(),
        email:    studentEmail?.trim() || `legacy+${Date.now()}@iprojectmaster.com`,
        phone:    studentPhone?.trim() || null,
        password: hash,
        role:     Role.CLIENT,
        isApproved: true,
      } as any,
    });
  }

  // ── Find a placeholder plan (cheapest active one) ─────────
  const plan = await prisma.plan.findFirst({
    where:   { isActive: true },
    orderBy: { priceKobo: "asc" },
  });
  if (!plan) return NextResponse.json({ error: "No active plans configured." }, { status: 400 });

  // ── Create placeholder order ────────────────────────────────
  const order = await prisma.order.create({
    data: {
      clientId:           student.id,
      planId:             plan.id,
      topic:              topic.trim(),
      department:         department?.trim() || "Not specified",
      degreeGroup,
      serviceType:        "HIRE_WRITER",
      status:             "ACTIVE",
      guidelineFileUrl:   guidelineFileUrl || null,
      adminNote:          `Legacy correction lodged by admin ${session.user.name} on ${new Date().toLocaleDateString("en-NG")}`,
    } as any,
  });

  // ── Create placeholder chapter routed straight to QC ───────
  const chapter = await prisma.orderChapter.create({
    data: {
      orderId:         order.id,
      chapterNumber:   1,
      chapterLabel:    chapterLabel.trim(),
      status:          ChapterStatus.QC_IN_PROGRESS,
      correctionNotes: correctionRequest.trim(),
      routedToQcId:    qcId,
      routedToQcAt:    new Date(),
      qcStartedAt:     null,          // lands in QC Pending, not Active
      isCorrectionHistory: true,      // shows in QC corrections flow
    } as any,
  });

  // ── Mark order as having a correction in progress ──────────
  await prisma.order.update({
    where: { id: order.id },
    data:  { status: "ACTIVE" } as any,
  });

  // ── Notify QC (in-app + email) ─────────────────────────────
  await prisma.notification.create({
    data: {
      userId:  qcId,
      orderId: order.id,
      title:   "🔧 Legacy Correction Assigned",
      message: `Admin has lodged a correction for "${topic}" (${chapterLabel}) for a legacy client. Check your Pending Corrections.`,
      type:    "ACTION_REQUIRED",
    },
  });

  try {
    await resend.emails.send({
      from: FROM,
      to:   qc.email,
      subject: `🔧 Legacy Correction Assigned — ${chapterLabel} (${topic.slice(0,50)}...)`,
      html: `
        <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:1.5rem;background:#fff;border-radius:14px;border:1px solid #FED7AA;">
          <h2 style="color:#9A3412;font-size:1.1rem;margin:0 0 .75rem;">🔧 Legacy Correction Assigned</h2>
          <p style="color:#5B7EA6;font-size:.85rem;line-height:1.6;">Hi ${qc.name}, admin has manually lodged a correction job for a legacy client.</p>
          <table style="width:100%;font-size:.82rem;color:#0C1A2E;border-collapse:collapse;margin:.75rem 0;">
            <tr><td style="padding:.3rem 0;color:#5B7EA6;">Client</td><td style="font-weight:700;">${studentName.trim()}</td></tr>
            <tr><td style="padding:.3rem 0;color:#5B7EA6;">Topic</td><td style="font-weight:700;">${topic.trim()}</td></tr>
            <tr><td style="padding:.3rem 0;color:#5B7EA6;">Chapter</td><td style="font-weight:700;">${chapterLabel.trim()}</td></tr>
            <tr><td style="padding:.3rem 0;color:#5B7EA6;">Department</td><td style="font-weight:700;">${department?.trim() || "Not specified"}</td></tr>
          </table>
          <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:1rem;margin:.75rem 0;">
            <p style="color:#9A3412;font-size:.78rem;font-weight:700;margin:0 0 .4rem;">What Needs Correcting:</p>
            <p style="color:#7C2D12;font-size:.82rem;line-height:1.6;margin:0;">${correctionRequest.trim()}</p>
          </div>
          <a href="${APP}/qc/corrections/pending" style="display:inline-block;margin-top:1rem;padding:.7rem 1.5rem;background:#38BDF8;color:#0C1A2E;font-weight:700;font-size:.85rem;border-radius:10px;text-decoration:none;">View Pending Corrections →</a>
        </div>
      `,
    });
  } catch (e) { console.error("[EMAIL] Lodge correction QC notify:", e); }

  return NextResponse.json({
    success:   true,
    message:   `Correction lodged and assigned to ${qc.name}.`,
    orderId:   order.id,
    chapterId: chapter.id,
  });
}
