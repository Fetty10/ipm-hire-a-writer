// src/app/api/orders/route.ts
// POST — student places a new order and gets a Paystack payment URL

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    planId, topic, department, degreeGroup,
    specialInstructions, guidelineFileUrl, chaptersRequested,
  } = await req.json();

  if (!planId || !topic || !department || !degreeGroup) {
    return NextResponse.json(
      { error: "Plan, topic, department and degree level are required." },
      { status: 400 }
    );
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Selected plan is not available." }, { status: 404 });
  }

  // Calculate amount
  let amountKobo = plan.priceKobo;
  if (plan.pricingType === "PER_CHAPTER" && chaptersRequested?.length) {
    amountKobo = plan.priceKobo * chaptersRequested.length;
  }

  // Create order (PENDING_PAYMENT)
  const order = await prisma.order.create({
    data: {
      clientId:            session.user.id,
      planId,
      topic:               topic.trim(),
      department:          department.trim(),
      degreeGroup,
      specialInstructions: specialInstructions?.trim() || null,
      guidelineFileUrl:    guidelineFileUrl || null,
      selectedChapters:    chaptersRequested?.length ? chaptersRequested.sort().join(",") : null,
      status:              "PENDING_PAYMENT",
      requiresPlagiarismCheck: plan.includesPlagiarismCheck,
      requiresAiCheck:         plan.includesPlagiarismCheck, // same flag
    },
  });

  // Initialize Paystack payment
  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email:    session.user.email,
      amount:   amountKobo,
      currency: "NGN",
      metadata: {
        orderId:          order.id,
        studentName:      session.user.name,
        topic,
        chaptersRequested: chaptersRequested || [],
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/dashboard?payment=success`,
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackData.status) {
    // Roll back order
    await prisma.order.delete({ where: { id: order.id } });
    return NextResponse.json(
      { error: "Payment initialization failed. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success:  true,
    orderId:  order.id,
    paymentUrl: paystackData.data.authorization_url,
    reference:  paystackData.data.reference,
  });
}
