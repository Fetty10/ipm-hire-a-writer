export const dynamic = "force-dynamic";
// src/app/api/admin/earnings-summary/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const earnings = await prisma.earning.findMany({
    select: { amountKobo: true, status: true },
  });

  const totalKobo     = earnings.reduce((s, e) => s + e.amountKobo, 0);
  const availableKobo = earnings.filter(e => e.status === "AVAILABLE").reduce((s, e) => s + e.amountKobo, 0);
  const pendingKobo   = earnings.filter(e => e.status === "PENDING").reduce((s, e) => s + e.amountKobo, 0);
  const withdrawnKobo = earnings.filter(e => e.status === "WITHDRAWN").reduce((s, e) => s + e.amountKobo, 0);

  // Total withdrawal requests
  const withdrawals = await prisma.withdrawal.findMany({
    select: { amountKobo: true, status: true },
  });
  const totalWithdrawals    = withdrawals.length;
  const totalWithdrawnKobo  = withdrawals.filter(w => w.status === "PAID").reduce((s, w) => s + w.amountKobo, 0);
  const pendingWithdrawals  = withdrawals.filter(w => w.status === "PENDING").length;
  const pendingWithdrawKobo = withdrawals.filter(w => w.status === "PENDING").reduce((s, w) => s + w.amountKobo, 0);

  return NextResponse.json({
    success: true,
    data: {
      totalKobo,
      availableKobo,
      pendingKobo,
      withdrawnKobo,
      totalWithdrawals,
      totalWithdrawnKobo,
      pendingWithdrawals,
      pendingWithdrawKobo,
    },
  });
}
