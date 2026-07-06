export const dynamic = "force-dynamic";
// src/app/api/payments/flutterwave/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY!;
const APP_URL    = process.env.NEXTAUTH_URL || "https://hire.iprojectmaster.com";

// POST: initialize Flutterwave payment
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    planId, topic, department, degreeGroup,
    specialInstructions, guidelineFileUrl, chaptersRequested,
    serviceType, currency, amount, isOtherService,
  } = await req.json();

  if (!topic?.trim() || !degreeGroup || !currency || !amount) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Resolve plan using raw query to get international prices
  let plan: any = null;
  if (planId && planId !== "flat") {
    const plans = await prisma.$queryRaw<any[]>`
      SELECT id, "planName", "pricingType", "priceKobo",
        "priceGHS"::integer, "priceKES"::integer, "priceUSD"::integer, "priceGBP"::integer,
        "includesPlagiarismCheck"
      FROM "Plan" WHERE id = ${planId} LIMIT 1
    `;
    plan = plans[0] || null;
  }
  if (!plan) {
    const plans = await prisma.$queryRaw<any[]>`
      SELECT id, "planName", "pricingType", "priceKobo",
        "priceGHS"::integer, "priceKES"::integer, "priceUSD"::integer, "priceGBP"::integer,
        "includesPlagiarismCheck"
      FROM "Plan" WHERE "isActive" = true ORDER BY "updatedAt" ASC LIMIT 1
    `;
    plan = plans[0] || null;
  }
  if (!plan) return NextResponse.json({ error: "No plan found." }, { status: 400 });

  // Calculate correct amount for the currency
  // Always recalculate server-side to avoid frontend currency detection issues
  const isNGN = currency === "NGN";
  let calculatedAmount = amount;

  if (!isNGN && planId && planId !== "flat") {
    const intlKey = `price${currency}` as string;
    const intlVal = plan[intlKey];
    console.log("[FLW] currency:", currency, "intlKey:", intlKey, "intlVal:", intlVal, "plan keys:", Object.keys(plan));
    if (intlVal) {
      const unitPrice = intlVal / 100;
      calculatedAmount = chaptersRequested?.length
        ? unitPrice * chaptersRequested.length
        : unitPrice;
    }
  }
  console.log("[FLW] amount from frontend:", amount, "calculatedAmount:", calculatedAmount, "currency:", currency);

  // Create order first
  const tx_ref = `IPM-FLW-${Date.now()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

  const isProjectService = !!(planId && planId !== "flat");

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
      serviceType:         serviceType || "HIRE_WRITER",
      status:              "PENDING_PAYMENT",
      currency,
      flutterwaveReference: tx_ref,
      requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : false,
      requiresAiCheck:         isProjectService ? plan.includesPlagiarismCheck : false,
    } as any,
  });

  // Initiate Flutterwave payment
  const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${FLW_SECRET}`,
    },
    body: JSON.stringify({
      tx_ref,
      amount: calculatedAmount,
      currency,
      redirect_url: `${APP_URL}/api/payments/flutterwave/callback`,
      customer: {
        email: session.user.email,
        name:  session.user.name,
      },
      meta: {
        orderId:   order.id,
        studentId: session.user.id,
      },
      customizations: {
        title:       "iProjectMaster",
        description: `${topic.trim()} — ${serviceType || "Project"}`,
        logo:        `${APP_URL}/logo.png`,
      },
      payment_options: currency === "GHS" ? "mobilemoneyghana,card" :
                       currency === "KES" ? "mpesa,card" : "card",
    }),
  });

  const flwData = await flwRes.json();

  if (flwData.status !== "success") {
    // Clean up order if FLW failed
    await prisma.order.delete({ where: { id: order.id } });
    return NextResponse.json({ error: flwData.message || "Payment initialization failed." }, { status: 400 });
  }

  return NextResponse.json({
    success:      true,
    paymentLink:  flwData.data.link,
    orderId:      order.id,
    tx_ref,
  });
}
