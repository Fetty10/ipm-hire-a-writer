export const dynamic = "force-dynamic";
// src/app/api/auth/register/route.ts
// Handles registration for clients AND staff
// Staff accounts start as isApproved: false — Main Admin must approve

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Only these roles can self-register as staff
const ALLOWED_STAFF_ROLES: Role[] = [Role.WRITER, Role.ANALYST, Role.QC];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password, role, phone, institution, department } = body;

  // ── Validation ────────────────────────────────────────────
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  // Admins cannot self-register
  const requestedRole: Role = role ?? Role.CLIENT;
  if (
    requestedRole === Role.MAIN_ADMIN ||
    requestedRole === Role.SUB_ADMIN
  ) {
    return NextResponse.json(
      { error: "Admin accounts cannot be self-registered." },
      { status: 403 }
    );
  }

  // ── Check duplicate ───────────────────────────────────────
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // ── Hash password ─────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(password, 12);

  // Staff start unapproved; clients are auto-approved
  const isStaff = ALLOWED_STAFF_ROLES.includes(requestedRole);

  // ── Create user ───────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password:    hashedPassword,
      role:        requestedRole,
      phone:       phone ?? null,
      institution: institution ?? null,
      department:  department ?? null,
      isApproved:  !isStaff, // clients are approved immediately
      isSuspended: false,
    },
    select: {
      id:         true,
      name:       true,
      email:      true,
      role:       true,
      isApproved: true,
    },
  });

  // ── Notify main admins of new staff registration ──────────
  if (isStaff) {
    const admins = await prisma.user.findMany({
      where: { role: Role.MAIN_ADMIN },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId:  admin.id,
        title:   "New Staff Registration",
        message: `${name} has registered as a ${requestedRole}. Please review and approve their account in the staff management panel.`,
        type:    "ACTION_REQUIRED" as const,
      })),
    });
  }

  return NextResponse.json({
    success: true,
    user,
    message: isStaff
      ? "Registration successful. Your account is pending admin approval."
      : "Registration successful. You can now log in.",
  });
}
