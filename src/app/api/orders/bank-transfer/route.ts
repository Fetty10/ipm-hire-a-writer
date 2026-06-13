export const dynamic = "force-dynamic";
// src/app/api/orders/bank-transfer/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { assignChaptersForOrder } from "@/lib/assignment";

export async function GET() {
  const account = await (prisma as any).bankAccount.findFirst({
    where: { isActive: true },
  });
  return NextResponse.json({ success: true, data: account });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { planId, topic, department, degreeGroup, specialInstructions, guidelineFileUrl, chaptersRequested, serviceType } = body;

    console.log("[BT] Received:", JSON.stringify({ planId, topic, degreeGroup, serviceType }));

    if (!topic?.trim() || !degreeGroup) {
      return NextResponse.json({ error: "Topic and degree group are required." }, { status: 400 });
    }

    const isProjectService = planId && planId !== "flat";
    console.log("[BT] isProjectService:", isProjectService, "planId:", planId);

    // Resolve plan
    let plan: any = null;
    if (isProjectService) {
      plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 400 });
    } else {
      // For flat services — find any plan just to satisfy the foreign key
      plan = await prisma.plan.findFirst({ orderBy: { updatedAt: "asc" } });
      if (!plan) return NextResponse.json({ error: "No plans configured. Please contact admin." }, { status: 400 });
    }

    console.log("[BT] Plan found:", plan?.id, plan?.planName);

    // Calculate amount
    let amountKobo = 0;
    if (isProjectService) {
      amountKobo = plan.pricingType === "PER_CHAPTER"
        ? plan.priceKobo * (chaptersRequested?.length || 1)
        : plan.priceKobo;
    } else {
      const svcValueMap: Record<string,string> = {
        PROPOSAL_SEMINAR: "seminar",
        JOURNAL_WRITING:  "journal",
        JOURNAL_SOURCING: "journal",
        TOPIC_SUGGESTION: "topic",
        HIRE_WRITER:      "assignment",
      };
      const svcValue = svcValueMap[serviceType] || serviceType?.toLowerCase();
      console.log("[BT] Looking up OtherService:", svcValue);
      const svc = await (prisma as any).otherService.findFirst({
        where: { value: svcValue, isActive: true },
      });
      console.log("[BT] OtherService found:", svc?.label, "prices:", svc?.priceOND, svc?.priceBSC, svc?.pricePGD);
      const priceMap: Record<string,number> = {
        OND_HND_NCE: svc?.priceOND || 0,
        BSC_BED_BA:  svc?.priceBSC || 0,
        PGD_MSC_PHD: svc?.pricePGD || 0,
        PHD:         svc?.pricePHD || svc?.pricePGD || 0,
      };
      amountKobo = priceMap[degreeGroup] || 0;
      console.log("[BT] amountKobo:", amountKobo);
    }

    const reference = `IPM-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    console.log("[BT] Creating order with planId:", plan.id, "serviceType:", serviceType);

    const order = await prisma.order.create({
      data: {
        clientId:             session.user.id,
        planId:               plan.id,
        topic:                topic.trim(),
        department:           department?.trim() || "",
        degreeGroup,
        specialInstructions:  specialInstructions?.trim() || null,
        guidelineFileUrl:     guidelineFileUrl || null,
        selectedChapters:     chaptersRequested ? chaptersRequested.join(",") : null,
        serviceType:          (serviceType === "PROJECT" ? "HIRE_WRITER" : serviceType) || "HIRE_WRITER",
        status:               "PENDING_PAYMENT",
        paymentMethod:        "BANK_TRANSFER",
        bankTransferReference: reference,
      } as any,
    });

    console.log("[BT] Order created:", order.id);

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
          message: `"${topic.trim()}" — Ref: ${reference}. Amount: ₦${(amountKobo/100).toLocaleString()}.`,
          type:    "ACTION_REQUIRED" as const,
        })),
      });
    }

    return NextResponse.json({ success: true, orderId: order.id, reference, amountKobo, amountNaira: amountKobo / 100 });

  } catch (err: any) {
    console.error("[BT] Error:", err?.message, err?.stack);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

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

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status:                    "PAYMENT_CONFIRMED",
      paidAt:                    new Date(),
      bankTransferConfirmedAt:   new Date(),
      bankTransferConfirmedById: session.user.id,
    } as any,
  });

  await assignChaptersForOrder(orderId);
  await prisma.order.update({ where: { id: orderId }, data: { status: "IN_PROGRESS" } });

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
