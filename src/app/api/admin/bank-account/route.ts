export const dynamic = "force-dynamic";
// src/app/api/admin/bank-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["MAIN_ADMIN","SUB_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountName, accountNumber, bankName } = await req.json();
  if (!accountName || !accountNumber || !bankName) {
    return NextResponse.json({ error: "All fields required." }, { status: 400 });
  }

  // Update or create
  const existing = await (prisma as any).bankAccount.findFirst({ where: { isActive: true } });
  if (existing) {
    await (prisma as any).bankAccount.update({
      where: { id: existing.id },
      data:  { accountName, accountNumber, bankName, updatedAt: new Date() },
    });
  } else {
    await (prisma as any).bankAccount.create({
      data: { accountName, accountNumber, bankName },
    });
  }

  return NextResponse.json({ success: true, message: "Bank account updated." });
}
