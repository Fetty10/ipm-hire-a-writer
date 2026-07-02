export const dynamic = "force-dynamic";
// src/app/api/admin/lodge-correction/route.ts
// Admin lodges a manual correction job for a legacy client (not in the new system).
// Auto-assigns via round-robin to active (non-suspended) QC staff.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";
import { Resend } from "resend";
import { getNextQCForCorrectionRoundRobin } from "@/lib/assignment";
import { sendLegacyAccountCreatedEmail } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM   = "iProjectMaster <noreply@hire.iprojectmaster.com>";
const APP    = process.env.NEXT_PUBLIC_APP_URL || "https://hire.iprojectmaster.com";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    studentName,
    studentEmail,
    studentPhone,
    topic,
    chapterLabel,
    degreeGroup,
    department,
    correctionRequest,
    guidelineFileUrl,
  } = await req.json();

  if (!studentName?.trim() || !topic?.trim() || !chapterLabel?.trim() || !degreeGroup || !correctionRequest?.trim()) {
    return NextResponse.json({
      error: "studentName, topic, chapterLabel, degreeGroup and correctionRequest are all required.",
    }, { status: 400 });
  }

  // ── Auto-assign via round-robin — never assigns to suspended QC ──
  const qcId = await getNextQCForCorrectionRoundRobin();
  if (!qcId) {
    return NextResponse.json({
      error: "No active QC staff available. Please ensure at least one QC member is approved and not suspended.",
    }, { status: 400 });
  }

  const qc = await prisma.user.findUnique({
    where:  { id: qcId },
    select: { id: true, name: true, email: true },
  });
  if (!qc) return NextResponse.json({ error: "QC assignment failed." }, { status: 500 });

  // ── Create student account (always) ──────────────────────
  // For legacy clients — generate a readable temp password and email
  // credentials so they can log in and track/download their work.
  // If they already have an account with this email, reuse it.
  const bcrypt = await import("bcryptjs");

  // Generate a readable temp password: word + 4 digits
  const words = ["Project","Correct","Quality","Study","Review","Writer","Master"];
  const tempPassword = words[Math.floor(Math.random()*words.length)] + Math.floor(1000+Math.random()*9000);
  const hash = await bcrypt.hash(tempPassword, 10);

  let student = studentEmail?.trim()
    ? await prisma.user.findFirst({ where: { email: studentEmail.trim(), role: Role.CLIENT } })
    : null;

  let isNewAccount = false;
  if (!student) {
    if (!studentEmail?.trim()) {
      return NextResponse.json({
        error: "Client email is required so we can send them their login credentials and the corrected work.",
      }, { status: 400 });
    }
    student = await prisma.user.create({
      data: {
        name:       studentName.trim(),
        email:      studentEmail.trim(),
        phone:      studentPhone?.trim() || null,
        password:   hash,
        role:       Role.CLIENT,
        isApproved: true,
      } as any,
    });
    isNewAccount = true;
  }

  // ── Send welcome email with credentials (new accounts only) ─
  if (isNewAccount) {
    try {
      await sendLegacyAccountCreatedEmail({
        to:           student.email,
        name:         student.name,
        tempPassword: tempPassword,
        topic:        topic.trim(),
      });
    } catch (e) { console.error("[EMAIL] Legacy account created:", e); }
  }

  // ── Placeholder plan ──────────────────────────────────────
  const plan = await prisma.plan.findFirst({
    where:   { isActive: true },
    orderBy: { priceKobo: "asc" },
  });
  if (!plan) return NextResponse.json({ error: "No active plans configured." }, { status: 400 });

  // ── Create placeholder order ──────────────────────────────
  const order = await prisma.order.create({
    data: {
      clientId:         student.id,
      planId:           plan.id,
      topic:            topic.trim(),
      department:       department?.trim() || "Not specified",
      degreeGroup,
      serviceType:      "HIRE_WRITER",
      status:           "ACTIVE",
      guidelineFileUrl: guidelineFileUrl || null,
      adminNote:        `Legacy correction lodged by admin ${session.user.name} on ${new Date().toLocaleDateString("en-NG")}`,
    } as any,
  });

  // ── Create chapter routed straight to QC Pending Corrections ─
  const chapter = await prisma.orderChapter.create({
    data: {
      orderId:             order.id,
      chapterNumber:       1,
      chapterLabel:        chapterLabel.trim(),
      status:              ChapterStatus.QC_IN_PROGRESS,
      correctionNotes:     correctionRequest.trim(),
      routedToQcId:        qcId,
      routedToQcAt:        new Date(),
      qcStartedAt:         null,    // lands in Pending, not Active
      isCorrectionHistory: true,
    } as any,
  });

  // ── Notify QC (in-app + email) ────────────────────────────
  await prisma.notification.create({
    data: {
      userId:  qcId,
      orderId: order.id,
      title:   "🔧 Legacy Correction Assigned",
      message: `Admin has lodged a correction for "${topic}" (${chapterLabel}) for legacy client ${studentName}. Check your Pending Corrections.`,
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
          <h2 style="color:#9A3412;font-size:1.1rem;margin:0 0 .75rem;">🔧 Legacy Correction Assigned to You</h2>
          <p style="color:#5B7EA6;font-size:.85rem;line-height:1.6;">Hi ${qc.name}, admin has lodged a legacy correction job for you.</p>
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
          ${guidelineFileUrl ? `<p style="font-size:.78rem;color:#0369A1;margin:.5rem 0;">📎 ${guidelineFileUrl.split(",").length} file(s) attached — download from your Pending Corrections tab.</p>` : ""}
          <a href="${APP}/qc/corrections/pending" style="display:inline-block;margin-top:1rem;padding:.7rem 1.5rem;background:#38BDF8;color:#0C1A2E;font-weight:700;font-size:.85rem;border-radius:10px;text-decoration:none;">View Pending Corrections →</a>
        </div>
      `,
    });
  } catch (e) { console.error("[EMAIL] Lodge correction QC notify:", e); }

  return NextResponse.json({
    success:    true,
    message:    `Correction lodged and assigned to ${qc.name}. ${isNewAccount ? `Account created and credentials emailed to ${student.email}.` : `Existing account found for ${student.email}.`}`,
    assignedTo: qc.name,
    orderId:    order.id,
    chapterId:  chapter.id,
    accountCreated: isNewAccount,
  });
}
