export const dynamic = "force-dynamic";
// src/app/api/staff/profile/route.ts
// GET  — fetch own profile
// PATCH — update name, phone, bank details, password

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, bankName: true, accountNumber: true, accountName: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: user });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, currentPassword, newPassword } = await req.json();

  const updateData: Record<string, string> = {};
  if (name?.trim())  updateData.name  = name.trim();
  if (phone?.trim()) updateData.phone = phone.trim();

  // Password change
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to set a new password." },
        { status: 400 }
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const match = await bcrypt.compare(currentPassword, user!.password);
    if (!match) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: session.user.id }, data: updateData });

  return NextResponse.json({ success: true, message: "Profile updated successfully." });
}
