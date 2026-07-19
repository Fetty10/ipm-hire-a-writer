export const dynamic = "force-dynamic";
// src/app/api/auth/forgot-password/route.ts
// Step 1: Send OTP to WhatsApp
// Step 2: Verify OTP + reset password

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// In-memory OTP store — key: email, value: { otp, expiresAt }
const otpStore = new Map<string, { otp:string; expiresAt:number }>();

async function sendEmailOTP(email: string, otp: string, name: string): Promise<boolean> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { error } = await resend.emails.send({
    from:    "iProjectMaster <noreply@hire.iprojectmaster.com>",
    to:      email,
    subject: "Your iProjectMaster Password Reset Code",
    html: `
      <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
        <div style="font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;color:#0C1A2E;margin-bottom:1.5rem;">
          iProject<span style="color:#38BDF8;">Master</span>
        </div>
        <p style="color:#0C1A2E;font-size:.95rem;">Hi ${name.split(" ")[0]},</p>
        <p style="color:#475569;font-size:.88rem;line-height:1.7;">
          You requested a password reset. Use the code below to reset your password.
          This code expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#F0F9FF;border:1.5px solid #BAE6FD;border-radius:12px;padding:1.5rem;text-align:center;margin:1.5rem 0;">
          <div style="font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;color:#0C1A2E;letter-spacing:.3em;">${otp}</div>
        </div>
        <p style="color:#94A3B8;font-size:.78rem;">
          If you didn't request this, ignore this email — your password will not change.
        </p>
      </div>
    `,
  });
  return !error;
}

// POST /api/auth/forgot-password
// Body: { action: "send_otp", email } OR { action: "reset", email, otp, newPassword }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, email } = body;

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();

  // ── Find user ─────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where:  { email: cleanEmail },
    select: { id:true, name:true, phone:true, email:true },
  });

  if (!user) {
    // Don't reveal whether email exists — generic message
    return NextResponse.json({ success: true, message: "If that email is registered, an OTP has been sent to the associated WhatsApp number." });
  }

  if (!user.phone) {
    return NextResponse.json({ error: "No WhatsApp number on file for this account. Please contact support." }, { status: 400 });
  }

  // ── Send OTP ──────────────────────────────────────────
  if (action === "send_otp") {
    const otp       = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanEmail, { otp, expiresAt });

    const sent = await sendEmailOTP(cleanEmail, otp, user.name);
    if (!sent) {
      return NextResponse.json({ error: "Failed to send OTP email. Please try again or contact support." }, { status: 500 });
    }

    // Mask phone for display: 080****5678
    const p = user.phone.replace(/\D/g, "");
    const masked = p.slice(0,3) + "****" + p.slice(-4);

    return NextResponse.json({ success: true, maskedPhone: masked });
  }

  // ── Verify OTP + Reset Password ───────────────────────
  if (action === "reset") {
    const { otp, newPassword } = body;

    if (!otp || !newPassword) {
      return NextResponse.json({ error: "OTP and new password are required." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const stored = otpStore.get(cleanEmail);
    if (!stored) {
      return NextResponse.json({ error: "No OTP found. Please request a new one." }, { status: 400 });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanEmail);
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }
    if (stored.otp !== otp.trim()) {
      return NextResponse.json({ error: "Incorrect OTP. Please try again." }, { status: 400 });
    }

    // Reset password
    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: cleanEmail },
      data:  { password: hash },
    });

    otpStore.delete(cleanEmail);

    return NextResponse.json({ success: true, message: "Password reset successfully. You can now log in." });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
