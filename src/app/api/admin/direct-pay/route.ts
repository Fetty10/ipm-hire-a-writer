export const dynamic = "force-dynamic";
// src/app/api/admin/direct-pay/route.ts
// Admin pays a staff member directly without a withdrawal request

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { sendWithdrawalPaidEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.MAIN_ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { staffId, amountNaira } = await req.json();

  if (!staffId || !amountNaira || amountNaira <= 0) {
    return NextResponse.json({ error: "staffId and amountNaira are required." }, { status: 400 });
  }

  const staff = await prisma.user.findUnique({
    where:  { id: staffId },
    select: { id:true, name:true, email:true, bankName:true, accountNumber:true, accountName:true, role:true },
  });

  if (!staff || ![Role.WRITER, Role.ANALYST, Role.QC].includes(staff.role as Role)) {
    return NextResponse.json({ error: "Staff not found." }, { status: 404 });
  }

  const amountKobo = Math.round(amountNaira * 100);

  // Check available balance
  const available = await prisma.earning.aggregate({
    where:  { userId: staffId, status: "AVAILABLE" },
    _sum:   { amountKobo: true },
  });
  const availableKobo = available._sum.amountKobo || 0;

  if (amountKobo > availableKobo) {
    return NextResponse.json({
      error: `Insufficient balance. Staff has ₦${(availableKobo / 100).toLocaleString()} available.`
    }, { status: 400 });
  }

  // Create a withdrawal record
  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId:        staffId,
      amountKobo,
      status:        "PAID",
      bankName:      (staff as any).bankName || "Direct Transfer",
      accountNumber: (staff as any).accountNumber || "—",
      accountName:   (staff as any).accountName || staff.name,
      processedAt:   new Date(),
      processedById: session.user.id,
    } as any,
  });

  // Mark earnings as withdrawn (oldest first)
  const availableEarnings = await prisma.earning.findMany({
    where:   { userId: staffId, status: "AVAILABLE" },
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
        data: { userId: staffId, orderChapterId: earning.orderChapterId, amountKobo: remaining, status: "WITHDRAWN" },
      });
      remaining = 0;
    }
  }

  // Notify staff
  await prisma.notification.create({
    data: {
      userId:  staffId,
      title:   "Payment Received 💰",
      message: `₦${amountNaira.toLocaleString()} has been paid to your bank account by admin.`,
      type:    "SUCCESS",
    },
  });

  // Send email
  try {
    await sendWithdrawalPaidEmail({
      to:          staff.email,
      name:        staff.name,
      amountNaira: amountNaira,
      bankName:    (staff as any).bankName || "your bank account",
    });
  } catch (e) { console.error("[DIRECT PAY EMAIL]", e); }

  return NextResponse.json({
    success: true,
    message: `₦${amountNaira.toLocaleString()} marked as paid to ${staff.name}.`,
    withdrawalId: withdrawal.id,
  });
}
