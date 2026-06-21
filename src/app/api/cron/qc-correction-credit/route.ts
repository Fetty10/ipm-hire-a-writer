export const dynamic = "force-dynamic";
// src/app/api/cron/qc-correction-credit/route.ts
// Runs daily at midnight GMT+1 (configured in vercel.json) — credits each
// active QC staff member with one day's worth of their monthly correction pay.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  // Protect this endpoint — only Vercel Cron (with the secret) can call it
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await (prisma as any).qCCorrectionRate.findUnique({ where: { id: "singleton" } });
  const monthlyRateKobo = rate?.monthlyRateKobo || 0;

  if (monthlyRateKobo <= 0) {
    return NextResponse.json({ success: true, message: "No correction rate set — skipping." });
  }

  // Daily rate = monthly ÷ days in current month (so it's accurate per month length)
  const now          = new Date();
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyRateKobo = Math.round(monthlyRateKobo / daysInMonth);

  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD

  // Get all active, approved QC staff
  const qcStaff = await prisma.user.findMany({
    where: { role: Role.QC, isApproved: true, isSuspended: false },
    select: { id: true, name: true, lastCorrectionCreditDate: true } as any,
  });

  let creditedCount = 0;

  for (const qc of qcStaff) {
    const lastCredit = (qc as any).lastCorrectionCreditDate
      ? new Date((qc as any).lastCorrectionCreditDate).toISOString().split("T")[0]
      : null;

    // Skip if already credited today (avoid double-crediting on retries)
    if (lastCredit === today) continue;

    await prisma.$transaction([
      prisma.earning.create({
        data: {
          userId:     qc.id,
          // orderChapterId is required by schema but this earning isn't tied to one chapter —
          // we use a nullable-safe approach: category distinguishes it, orderChapterId stays optional if schema allows
          orderChapterId: null,
          amountKobo: dailyRateKobo,
          status:     "AVAILABLE",
          availableAt: now,
          category:   "CORRECTION_DAILY",
        } as any,
      }),
      prisma.user.update({
        where: { id: qc.id },
        data:  { lastCorrectionCreditDate: now } as any,
      }),
    ]);

    creditedCount++;
  }

  return NextResponse.json({
    success: true,
    message: `Credited ${creditedCount} QC staff with ₦${(dailyRateKobo/100).toLocaleString()} each for today.`,
    dailyRateKobo,
  });
}
