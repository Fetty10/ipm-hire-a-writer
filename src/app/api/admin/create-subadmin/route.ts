export const dynamic = "force-dynamic";
// src/app/api/admin/create-subadmin/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.MAIN_ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, phone, password } = await req.json();

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Check email not already taken
  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name:        name.trim(),
      email:       email.trim().toLowerCase(),
      phone:       phone.trim(),
      password:    hash,
      role:        Role.SUB_ADMIN,
      isApproved:  true,
      approvedAt:  new Date(),
      approvedById: session.user.id,
    } as any,
  });

  // Send welcome email with credentials
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from:    "iProjectMaster <noreply@hire.iprojectmaster.com>",
      to:      email.trim().toLowerCase(),
      subject: "Your iProjectMaster Admin Account",
      html: `
        <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:2rem;">
          <div style="font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;color:#0C1A2E;margin-bottom:1.5rem;">
            iProject<span style="color:#38BDF8;">Master</span>
          </div>
          <p style="color:#0C1A2E;">Hi ${name.trim()},</p>
          <p style="color:#475569;font-size:.88rem;line-height:1.7;">
            Your admin account has been created. You can now log in and help manage the platform.
          </p>
          <div style="background:#F0F9FF;border:1.5px solid #BAE6FD;border-radius:12px;padding:1.25rem;margin:1.5rem 0;">
            <div style="font-size:.78rem;color:#5B7EA6;margin-bottom:.5rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Your Login Details</div>
            <div style="margin-bottom:.5rem;"><strong>Email:</strong> ${email.trim().toLowerCase()}</div>
            <div style="margin-bottom:.5rem;"><strong>Password:</strong> ${password}</div>
            <div><strong>Login URL:</strong> <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/login" style="color:#0369A1;">${process.env.NEXT_PUBLIC_APP_URL}/staff/login</a></div>
          </div>
          <p style="color:#94A3B8;font-size:.78rem;">Please change your password after your first login.</p>
        </div>
      `,
    });
  } catch (e) { console.error("[CREATE SUBADMIN] Email failed:", e); }

  return NextResponse.json({ success: true, message: `Account created for ${name.trim()}. Login details sent to ${email}.`, userId: user.id });
}
