export const dynamic = "force-dynamic";
// src/app/api/auth/forgot-password/route.ts
// Step 1: Send OTP to WhatsApp
// Step 2: Verify OTP + reset password

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const WA_TOKEN    = process.env.WHATSAPP_TOKEN!;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID!;

// In-memory OTP store (resets on cold start — acceptable for short-lived OTPs)
// Key: email, Value: { otp, expiresAt }
const otpStore = new Map<string, { otp:string; expiresAt:number }>();

async function sendWhatsAppOTP(phone: string, otp: string, name: string): Promise<boolean> {
  // Normalize phone to international format
  const normalized = phone.replace(/\D/g, "");
  const intl = normalized.startsWith("0") ? "234" + normalized.slice(1) : normalized;

  const res = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WA_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to:                intl,
      type:              "text",
      text: {
        body: `Hi ${name.split(" ")[0]}, your iProjectMaster password reset code is:\n\n*${otp}*\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
      },
    }),
  });

  const data = await res.json();
  return res.ok && !data.error;
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

    const sent = await sendWhatsAppOTP(user.phone, otp, user.name);
    if (!sent) {
      return NextResponse.json({ error: "Failed to send OTP. Please try again or contact support." }, { status: 500 });
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
