// src/app/api/staff/earnings/route.ts
// Returns earnings summary + per-job breakdown for logged-in staff

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (![Role.WRITER, Role.ANALYST, Role.QC].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = session.user.id;

  // ── Earnings breakdown ────────────────────────────────────
  const earnings = await prisma.earning.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    include: {
      orderChapter: {
        select: {
          chapterLabel: true,
          order: {
            select: {
              topic:       true,
              degreeGroup: true,
              plan: {
                select: { planName: true },
              },
            },
          },
        },
      },
    },
  });

  // ── Summary totals ────────────────────────────────────────
  const summary = earnings.reduce(
    (acc, e) => {
      const naira = e.amountKobo / 100;
      acc.totalEarned += naira;
      if (e.status === "AVAILABLE")  acc.available  += naira;
      if (e.status === "PENDING")    acc.pending    += naira;
      if (e.status === "WITHDRAWN")  acc.withdrawn  += naira;
      return acc;
    },
    { available: 0, pending: 0, totalEarned: 0, withdrawn: 0 }
  );

  // ── Pending withdrawals ───────────────────────────────────
  const pendingWithdrawals = await prisma.withdrawal.findMany({
    where:   { userId, status: { in: ["PENDING", "APPROVED"] } },
    orderBy: { requestedAt: "desc" },
    select: {
      id: true, amountKobo: true, status: true,
      bankName: true, requestedAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      summary,
      earnings: earnings.map((e) => ({
        id:           e.id,
        amountNaira:  e.amountKobo / 100,
        status:       e.status,
        createdAt:    e.createdAt,
        availableAt:  e.availableAt,
        topic:        e.orderChapter.order.topic,
        chapterLabel: e.orderChapter.chapterLabel,
        degreeGroup:  e.orderChapter.order.degreeGroup,
        planName:     e.orderChapter.order.plan.planName,
      })),
      pendingWithdrawals: pendingWithdrawals.map((w) => ({
        ...w,
        amountNaira: w.amountKobo / 100,
      })),
    },
  });
}
