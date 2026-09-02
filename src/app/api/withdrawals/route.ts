export const dynamic = "force-dynamic";
// src/app/api/withdrawals/route.ts
// POST  — staff requests a withdrawal
// PATCH — admin approves → fires Paystack Transfer automatically

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { sendWithdrawalPaidEmail } from "@/lib/email";

// ─────────────────────────────────────────
// POST — Staff requests a withdrawal
// ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (![Role.WRITER, Role.ANALYST, Role.QC].includes(role)) {
    return NextResponse.json({ error: "Only staff members can request withdrawals." }, { status: 403 });
  }

  // ── Block withdrawal if staff has unresolved escalated corrections ──
  const staff = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { hasPendingCorrections: true } as any,
  });

  if ((staff as any)?.hasPendingCorrections) {
    const pendingChapters = await prisma.orderChapter.findMany({
      where:   { assignedToId: session.user.id, isEscalatedCorrection: true } as any,
      select:  { chapterLabel: true, order: { select: { topic: true } } },
      take: 5,
    });
    const list = pendingChapters.map((c: any) => `${c.chapterLabel} ("${c.order.topic}")`).join(", ");
    return NextResponse.json(
      { error: `You have unresolved correction(s) flagged by QC: ${list || "see your Active Jobs"}. Please complete and resubmit them before requesting a withdrawal.` },
      { status: 403 }
    );
  }

  const { amountKobo, bankName, accountNumber, accountName } = await req.json();

  if (!amountKobo || !bankName || !accountNumber || !accountName) {
    return NextResponse.json(
      { error: "Amount, bank name, account number and account name are required." },
      { status: 400 }
    );
  }

  if (amountKobo < 100000) { // min ₦1,000
    return NextResponse.json(
      { error: "Minimum withdrawal amount is ₦1,000." },
      { status: 400 }
    );
  }

  // Check available balance
  const available = await prisma.earning.aggregate({
    where:  { userId: session.user.id, status: "AVAILABLE" },
    _sum:   { amountKobo: true },
  });

  const availableKobo = available._sum.amountKobo ?? 0;
  if (amountKobo > availableKobo) {
    return NextResponse.json(
      { error: `Insufficient balance. Available: ₦${(availableKobo / 100).toLocaleString()}` },
      { status: 400 }
    );
  }

  // Prevent duplicate pending withdrawals
  const existingPending = await prisma.withdrawal.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
  });
  if (existingPending) {
    return NextResponse.json(
      { error: "You already have a pending withdrawal request. Please wait for it to be processed before making another." },
      { status: 400 }
    );
  }

  // Save bank details on user for future use
  await prisma.user.update({
    where: { id: session.user.id },
    data:  { bankName, accountNumber, accountName },
  });

  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId:        session.user.id,
      amountKobo,
      bankName,
      accountNumber,
      accountName,
      status:        "PENDING",
    },
  });

  // Notify admins
  const admins = await prisma.user.findMany({
    where:  { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId:  a.id,
      title:   "New Withdrawal Request",
      message: `${session.user.name} (${role}) has requested a withdrawal of ₦${(amountKobo / 100).toLocaleString()} to ${bankName}.`,
      type:    "ACTION_REQUIRED" as const,
    })),
  });

  return NextResponse.json({
    success: true,
    message: "Withdrawal request submitted. Admin will process it shortly.",
    data:    { withdrawalId: withdrawal.id },
  });
}

// ─────────────────────────────────────────
// PATCH — Admin marks withdrawal as paid manually
// ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { withdrawalId, action, adminNote } = await req.json();

  if (!withdrawalId || !action) {
    return NextResponse.json({ error: "withdrawalId and action are required." }, { status: 400 });
  }

  const withdrawal = await prisma.withdrawal.findUnique({
    where:   { id: withdrawalId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!withdrawal || withdrawal.status !== "PENDING") {
    return NextResponse.json({ error: "Withdrawal not found or already processed." }, { status: 404 });
  }

  if (action === "decline") {
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data:  { status: "REJECTED", adminNote, processedAt: new Date(), processedById: session.user.id } as any,
    });
    await prisma.notification.create({
      data: {
        userId:  withdrawal.userId,
        title:   "Withdrawal Request Declined",
        message: `Your withdrawal of ₦${(withdrawal.amountKobo / 100).toLocaleString()} was declined.${adminNote ? ` Reason: ${adminNote}` : ""}`,
        type:    "ALERT",
      },
    });
    return NextResponse.json({ success: true, message: "Withdrawal declined." });
  }

  if (action === "mark_paid") {
    // Deduct from earnings (oldest first)
    await markEarningsWithdrawn(withdrawal.userId, withdrawal.amountKobo);

    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data:  { status: "PAID", processedAt: new Date(), processedById: session.user.id } as any,
    });

    await prisma.notification.create({
      data: {
        userId:  withdrawal.userId,
        title:   "Withdrawal Paid 💰",
        message: `Your withdrawal of ₦${(withdrawal.amountKobo / 100).toLocaleString()} has been paid to your ${withdrawal.bankName} account.`,
        type:    "SUCCESS",
      },
    });

    await sendWithdrawalPaidEmail({
      to:          withdrawal.user.email,
      name:        withdrawal.user.name,
      amountNaira: withdrawal.amountKobo / 100,
      bankName:    withdrawal.bankName,
    });

    return NextResponse.json({
      success: true,
      message: `₦${(withdrawal.amountKobo / 100).toLocaleString()} marked as paid to ${withdrawal.user.name}.`,
    });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

// ─────────────────────────────────────────
// Helper: Mark earnings as withdrawn
// ─────────────────────────────────────────
async function markEarningsWithdrawn(userId: string, amountKobo: number) {
  const availableEarnings = await prisma.earning.findMany({
    where:   { userId, status: "AVAILABLE" },
    orderBy: { createdAt: "asc" },
  });

  let remaining = amountKobo;
  for (const earning of availableEarnings) {
    if (remaining <= 0) break;
    if (earning.amountKobo <= remaining) {
      await prisma.earning.update({ where: { id: earning.id }, data: { status: "WITHDRAWN" } });
      remaining -= earning.amountKobo;
    } else {
      await prisma.earning.update({
        where: { id: earning.id },
        data:  { amountKobo: earning.amountKobo - remaining },
      });
      await prisma.earning.create({
        data: { userId, orderChapterId: earning.orderChapterId, amountKobo: remaining, status: "WITHDRAWN" },
      });
      remaining = 0;
    }
  }
}
