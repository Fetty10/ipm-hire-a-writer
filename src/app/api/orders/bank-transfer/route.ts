export const dynamic = "force-dynamic";
// src/app/api/orders/bank-transfer/route.ts
// Handles bank transfer order creation and admin confirmation

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { assignChaptersForOrder } from "@/lib/assignment";

// ── GET: fetch bank account details (public) ─────────────────
export async function GET() {
  const account = await (prisma as any).bankAccount.findFirst({
    where: { isActive: true },
  });
  return NextResponse.json({ success: true, data: account });
}

// ── POST: student creates a bank transfer order ──────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    planId, topic, department, degreeGroup,
    specialInstructions, guidelineFileUrl, chaptersRequested, serviceType,
  } = await req.json();

  if (!topic?.trim() || !degreeGroup) {
    return NextResponse.json({ error: "Topic and degree group are required." }, { status: 400 });
  }

  // Validate plan
  const plan = planId && planId !== "flat"
    ? await prisma.plan.findUnique({ where: { id: planId } })
    : null;

  // Calculate amount
  let amountKobo = 0;
  if (plan) {
    amountKobo = plan.pricingType === "PER_CHAPTER"
      ? plan.priceKobo * (chaptersRequested?.length || 1)
      : plan.priceKobo;
  }

  // Generate unique reference
  const reference = `IPM-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

  // Create order with PENDING_PAYMENT status
  const order = await prisma.order.create({
    data: {
      clientId:            session.user.id,
      planId:              plan?.id || planId,
      topic:               topic.trim(),
      department:          department?.trim() || "",
      degreeGroup,
      specialInstructions: specialInstructions?.trim() || null,
      guidelineFileUrl:    guidelineFileUrl || null,
      selectedChapters:    chaptersRequested ? chaptersRequested.join(",") : null,
      serviceType:         serviceType || "HIRE_WRITER",
      status:              "PENDING_PAYMENT",
      paymentMethod:       "BANK_TRANSFER",
      bankTransferReference: reference,
    } as any,
  });

  // Notify admin
  const admins = await prisma.user.findMany({
    where: { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
    select: { id: true },
  });
  await prisma.notification.createMany({
    data: admins.map(a => ({
      userId:  a.id,
      orderId: order.id,
      title:   "New Bank Transfer Order",
      message: `${topic.trim()} — Ref: ${reference}. Amount: ₦${(amountKobo/100).toLocaleString()}. Confirm payment when received.`,
      type:    "ACTION_REQUIRED" as const,
    })),
  });

  return NextResponse.json({
    success:   true,
    orderId:   order.id,
    reference,
    amountKobo,
    amountNaira: amountKobo / 100,
  });
}

// ── PATCH: admin confirms bank transfer payment ───────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["MAIN_ADMIN","SUB_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { client: { select: { id: true, name: true, email: true } } },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Order already processed." }, { status: 409 });
  }

  // Confirm payment
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status:                   "PAYMENT_CONFIRMED",
      paidAt:                   new Date(),
      bankTransferConfirmedAt:  new Date(),
      bankTransferConfirmedById: session.user.id,
    } as any,
  });

  // Assign chapters
  await assignChaptersForOrder(orderId);

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "IN_PROGRESS" },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId:  order.clientId,
      orderId: order.id,
      title:   "Payment Confirmed — Work Started",
      message: `Your bank transfer payment for "${order.topic}" has been confirmed. Your order is now in progress!`,
      type:    "SUCCESS" as any,
    },
  });

  return NextResponse.json({ success: true, message: "Payment confirmed. Chapters assigned." });
}
