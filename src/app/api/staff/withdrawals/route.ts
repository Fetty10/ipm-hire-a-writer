export const dynamic = "force-dynamic";
// src/app/api/staff/withdrawals/route.ts
// Returns full withdrawal history for the logged-in staff member

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const withdrawals = await prisma.withdrawal.findMany({
    where:   { userId: session.user.id },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: withdrawals.map(w => ({
      id:            w.id,
      amountKobo:    w.amountKobo,
      bankName:      w.bankName,
      accountNumber: w.accountNumber,
      status:        w.status,
      requestedAt:   w.requestedAt,
      processedAt:   w.processedAt,
      adminNote:     w.adminNote,
    })),
  });
}
