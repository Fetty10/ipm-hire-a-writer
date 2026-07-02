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
    const { planId, topic, department, degreeGroup, specialInstructions, guidelineFileUrl, chaptersRequested, serviceType, requiresPlagiarismCheck } = body;

    console.log("[BT] Received:", JSON.stringify({ planId, topic, degreeGroup, serviceType }));

    if (!topic?.trim() || !degreeGroup) {
      return NextResponse.json({ error: "Topic and degree group are required." }, { status: 400 });
    }

    // ── Duplicate submission guard ────────────────────────────
    // If this student already has a PENDING_PAYMENT bank transfer order
    // for the same topic created within the last 10 minutes, block the
    // second submission — it was almost certainly an accidental retry.
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const duplicate = await prisma.order.findFirst({
      where: {
        clientId:      session.user.id,
        status:        "PENDING_PAYMENT",
        paymentMethod: "BANK_TRANSFER",
        topic:         topic.trim(),
        createdAt:     { gte: tenMinutesAgo },
      } as any,
    });
    if (duplicate) {
      return NextResponse.json({
        error: "You already have a pending bank transfer for this order. Please use the reference you already received, or wait a few minutes before trying again.",
        existingOrderId: duplicate.id,
      }, { status: 409 });
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

      // Add plagiarism/AI check add-on if requested and a price exists
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
        amountPaidKobo:       amountKobo,
        requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
        requiresAiCheck:         isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
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

    // Email the dedicated payments inbox so confirmations happen promptly
    // even if nobody is logged into the admin dashboard at the time.
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY!);
      await resend.emails.send({
        from: "iProjectMaster <noreply@hire.iprojectmaster.com>",
        to:   "payment.iprojectmaster@gmail.com",
        subject: `🏦 New Bank Transfer — ₦${(amountKobo/100).toLocaleString()} (Ref: ${reference})`,
        html: `
          <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:1.5rem;background:#fff;border-radius:14px;border:1px solid #BAE6FD;">
            <h2 style="color:#0C1A2E;font-size:1.1rem;margin:0 0 .75rem;">🏦 New Bank Transfer Order</h2>
            <table style="width:100%;font-size:.85rem;color:#0C1A2E;border-collapse:collapse;">
              <tr><td style="padding:.4rem 0;color:#5B7EA6;">Topic</td><td style="padding:.4rem 0;font-weight:700;">${topic.trim()}</td></tr>
              <tr><td style="padding:.4rem 0;color:#5B7EA6;">Amount</td><td style="padding:.4rem 0;font-weight:700;">₦${(amountKobo/100).toLocaleString()}</td></tr>
              <tr><td style="padding:.4rem 0;color:#5B7EA6;">Reference</td><td style="padding:.4rem 0;font-weight:700;font-family:monospace;">${reference}</td></tr>
              <tr><td style="padding:.4rem 0;color:#5B7EA6;">Student</td><td style="padding:.4rem 0;font-weight:700;">${session.user.name}</td></tr>
            </table>
            <p style="color:#5B7EA6;font-size:.8rem;line-height:1.6;margin-top:1rem;">Once payment is confirmed in your bank, log in and confirm it under Admin → Bank Transfers to assign the chapters.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/bank-transfers" style="display:inline-block;margin-top:.75rem;padding:.7rem 1.5rem;background:#38BDF8;color:#0C1A2E;font-weight:700;font-size:.85rem;border-radius:10px;text-decoration:none;">Go to Bank Transfers →</a>
          </div>
        `,
      });
    } catch (e) { console.error("[EMAIL] Bank transfer admin notify:", e); }

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
