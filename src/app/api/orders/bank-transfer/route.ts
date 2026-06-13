export const dynamic = "force-dynamic";
// src/app/api/orders/bank-transfer/route.ts

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

  // Resolve plan — for flat/non-project services find any active plan for this degree group
  let plan = null;
  if (planId && planId !== "flat") {
    plan = await prisma.plan.findUnique({ where: { id: planId } });
  }

  // If no plan found (flat service), find the BASIC plan for this degree group as a placeholder
  if (!plan) {
    plan = await prisma.plan.findFirst({
      where: { degreeGroup, planName: "BASIC", isActive: true },
    });
  }

  if (!plan) {
    return NextResponse.json({ error: "No pricing plan found for this level." }, { status: 400 });
  }

  // Calculate amount
  const amountKobo = plan.pricingType === "PER_CHAPTER"
    ? plan.priceKobo * (chaptersRequested?.length || 1)
    : plan.priceKobo;

  // Generate unique reference
  const reference = `IPM-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

  // Create order
  const order = await prisma.order.create({
    data: {
      clientId:            session.user.id,
      planId:              plan.id,
      topic:               topic.trim(),
      department:          department?.trim() || "",
      degreeGroup,
      specialInstructions: specialInstructions?.trim() || null,
      guidelineFileUrl:    guidelineFileUrl || null,
      selectedChapters:    chaptersRequested ? chaptersRequested.join(",") : null,
      serviceType:         (serviceType === "PROJECT" ? "HIRE_WRITER" : serviceType) || "HIRE_WRITER",
      status:              "PENDING_PAYMENT",
      paymentMethod:       "BANK_TRANSFER",
      bankTransferReference: reference,
    } as any,
  });

  // Notify all admins
  const admins = await prisma.user.findMany({
    where: { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
    select: { id: true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId:  a.id,
        orderId: order.id,
        title:   "🏦 New Bank Transfer Order",
        message: `"${topic.trim()}" — Ref: ${reference}. Amount: ₦${(amountKobo/100).toLocaleString()}. Confirm when payment is received.`,
        type:    "ACTION_REQUIRED" as const,
      })),
    });
  }

  return NextResponse.json({
    success:    true,
    orderId:    order.id,
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
      status:                    "PAYMENT_CONFIRMED",
      paidAt:                    new Date(),
      amountPaidKobo:            order.amountPaidKobo || 0,
      bankTransferConfirmedAt:   new Date(),
      bankTransferConfirmedById: session.user.id,
    } as any,
  });

  // Assign chapters and move to IN_PROGRESS
  await assignChaptersForOrder(orderId);

  await prisma.order.update({
    where: { id: orderId },
    data:  { status: "IN_PROGRESS" },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId:  order.clientId,
      orderId: order.id,
      title:   "✅ Payment Confirmed — Work Started",
      message: `Your bank transfer payment for "${order.topic}" has been confirmed. Your order is now in progress!`,
      type:    "INFO",
    },
  });

  return NextResponse.json({ success: true, message: "Payment confirmed. Chapters assigned." });
}
