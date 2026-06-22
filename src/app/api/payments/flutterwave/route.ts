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

  // Resolve plan
  let plan: any = null;
  if (planId && planId !== "flat") {
    plan = await prisma.plan.findUnique({ where: { id: planId } });
  }
  if (!plan) {
    plan = await prisma.plan.findFirst({ orderBy: { updatedAt: "asc" } });
  }
  if (!plan) return NextResponse.json({ error: "No plan found." }, { status: 400 });

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
      amount,
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
