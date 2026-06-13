export const dynamic = "force-dynamic";
// src/app/api/auth/password-reset/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const APP = process.env.NEXTAUTH_URL || "https://hire.iprojectmaster.com";
const FROM = "iProjectMaster <noreply@iprojectmaster.com>";

// POST: request reset link
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ success: true });

  // Delete any existing tokens for this user
  await (prisma as any).passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Create new token
  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await (prisma as any).passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${APP}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to:   user.email,
    subject: "Reset Your iProjectMaster Password",
    html: `
      <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:0 auto;padding:2rem;background:#fff;border-radius:16px;border:1px solid #E0F2FE;">
        <div style="text-align:center;margin-bottom:1.5rem;">
          <h2 style="font-family:'Syne',sans-serif;color:#0C1A2E;font-size:1.5rem;font-weight:800;margin:0;">Reset Your Password</h2>
        </div>
        <p style="color:#5B7EA6;font-size:.9rem;line-height:1.6;">Hi ${user.name},</p>
        <p style="color:#5B7EA6;font-size:.9rem;line-height:1.6;">We received a request to reset your password. Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
        <div style="text-align:center;margin:2rem 0;">
          <a href="${resetUrl}" style="display:inline-block;padding:.85rem 2rem;background:#38BDF8;color:#0C1A2E;font-weight:700;font-size:.9rem;border-radius:12px;text-decoration:none;">Reset Password →</a>
        </div>
        <p style="color:#5B7EA6;font-size:.8rem;line-height:1.6;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
        <p style="color:#BAE6FD;font-size:.75rem;margin-top:1.5rem;border-top:1px solid #E0F2FE;padding-top:1rem;">iProjectMaster Research Services</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}

// PATCH: set new password
export async function PATCH(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: "Token and password required." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const record = await (prisma as any).passwordResetToken.findUnique({ where: { token } });

  if (!record)             return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  if (record.usedAt)       return NextResponse.json({ error: "This reset link has already been used." }, { status: 400 });
  if (new Date() > new Date(record.expiresAt)) {
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } });
  await (prisma as any).passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } });

  return NextResponse.json({ success: true, message: "Password updated successfully." });
}
