export const dynamic = "force-dynamic";
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const ALLOWED_STAFF_ROLES: Role[] = [Role.WRITER, Role.ANALYST, Role.QC];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password, role, phone, cvUrl, sampleUrl } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const requestedRole: Role = role ?? Role.CLIENT;
  if ([Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(requestedRole)) {
    return NextResponse.json({ error: "Admin accounts cannot be self-registered." }, { status: 403 });
  }

  const isStaff = ALLOWED_STAFF_ROLES.includes(requestedRole);

  // Staff must upload CV and work sample
  if (isStaff) {
    if (!cvUrl)     return NextResponse.json({ error: "CV is required for staff applications." }, { status: 400 });
    if (!sampleUrl) return NextResponse.json({ error: "Work sample is required for staff applications." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password:    hashedPassword,
      role:        requestedRole,
      phone:       phone ?? null,
      isApproved:  !isStaff,
      isSuspended: false,
      // Store CV and sample URLs on the user record
      ...(isStaff ? { cvFileUrl: cvUrl, sampleFileUrl: sampleUrl } : {}),
    },
    select: { id: true, name: true, email: true, role: true, isApproved: true },
  });

  // Notify admins of new staff application
  if (isStaff) {
    const admins = await prisma.user.findMany({
      where: { role: Role.MAIN_ADMIN },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId:  admin.id,
        title:   "New Staff Application",
        message: `${name} has applied as a ${requestedRole} and uploaded their CV and work sample. Review their application in Staff Approvals.`,
        type:    "ACTION_REQUIRED" as const,
      })),
    });
  }

  return NextResponse.json({
    success: true,
    user,
    message: isStaff
      ? "Application submitted. Your account is pending admin approval."
      : "Registration successful. You can now log in.",
  });
}
