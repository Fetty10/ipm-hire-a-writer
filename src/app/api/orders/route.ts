export const dynamic = "force-dynamic";
// src/app/api/orders/route.ts
// POST — student places a new order and gets a Paystack payment URL
// Supports both project orders (planId) and flat/other services

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
    serviceType, requiresPlagiarismCheck,
  } = await req.json();

  if (!topic?.trim() || !department?.trim() || !degreeGroup) {
    return NextResponse.json(
      { error: "Topic, department and degree level are required." },
      { status: 400 }
    );
  }

  const isProjectService = planId && planId !== "flat";

  let plan: any = null;
  let amountKobo = 0;
  let finalServiceType = "HIRE_WRITER";

  if (isProjectService) {
    plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Selected plan is not available." }, { status: 404 });
    }
    amountKobo = plan.priceKobo;
    if (plan.pricingType === "PER_CHAPTER" && chaptersRequested?.length) {
      amountKobo = plan.priceKobo * chaptersRequested.length;
    }
  } else {
    // Flat/other service — find a placeholder plan for the FK, price from OtherService
    plan = await prisma.plan.findFirst({ orderBy: { updatedAt: "asc" } });
    if (!plan) return NextResponse.json({ error: "No plans configured." }, { status: 400 });

    const svcValueMap: Record<string,string> = {
      PROPOSAL_SEMINAR: "seminar",
      JOURNAL_WRITING:  "journal",
      JOURNAL_SOURCING: "journal_sourcing",
      TOPIC_SUGGESTION: "topic",
      HIRE_WRITER:      "assignment",
    };
    finalServiceType = (serviceType === "PROJECT" ? "HIRE_WRITER" : serviceType) || "HIRE_WRITER";
    const svcValue = svcValueMap[finalServiceType] || finalServiceType?.toLowerCase();

    const svc = await (prisma as any).otherService.findFirst({ where: { value: svcValue, isActive: true } });

    const priceMap: Record<string,number> = {
      OND_HND_NCE: svc?.priceOND || 0,
      BSC_BED_BA:  svc?.priceBSC || 0,
      PGD_MSC_PHD: svc?.pricePGD || 0,
      PHD:         svc?.pricePHD || svc?.pricePGD || 0,
    };
    amountKobo = priceMap[degreeGroup] || 0;

    // Add plagiarism/AI check add-on if requested
    if (requiresPlagiarismCheck && svc) {
      const addOnMap: Record<string,number> = {
        OND_HND_NCE: (svc as any).plagiarismAddOnOND || 0,
        BSC_BED_BA:  (svc as any).plagiarismAddOnBSC || 0,
        PGD_MSC_PHD: (svc as any).plagiarismAddOnPGD || 0,
        PHD:         (svc as any).plagiarismAddOnPHD || 0,
      };
      amountKobo += addOnMap[degreeGroup] || 0;
    }
  }

  // Create order (PENDING_PAYMENT)
  const order = await prisma.order.create({
    data: {
      clientId:            session.user.id,
      planId:              plan.id,
      topic:               topic.trim(),
      department:          department.trim(),
      degreeGroup,
      specialInstructions: specialInstructions?.trim() || null,
      guidelineFileUrl:    guidelineFileUrl || null,
      selectedChapters:    chaptersRequested?.length ? chaptersRequested.sort().join(",") : null,
      serviceType:         isProjectService ? "HIRE_WRITER" : finalServiceType,
      status:              "PENDING_PAYMENT",
      requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
      requiresAiCheck:         isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
    } as any,
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
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/inprogress`,
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
