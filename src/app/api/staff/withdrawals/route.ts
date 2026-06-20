export const dynamic = "force-dynamic";
// src/app/api/staff/withdrawals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page    = parseInt(searchParams.get("page") || "1");
  const perPage = 10;

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where:   { userId: session.user.id },
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.withdrawal.count({ where: { userId: session.user.id } }),
  ]);

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
    total, page, pages: Math.ceil(total / perPage),
  });
}
