export const dynamic = "force-dynamic";
// src/app/api/orders/retry-payment/route.ts
// Re-initializes payment for an order that's still PENDING_PAYMENT
// (e.g. student cancelled the Paystack/Flutterwave checkout the first time)

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

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId: session.user.id, status: "PENDING_PAYMENT" },
    include: { plan: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found or already paid." }, { status: 404 });
  }

  if ((order as any).paymentMethod === "BANK_TRANSFER") {
    return NextResponse.json({ error: "This order is a bank transfer — no retry needed, awaiting admin confirmation." }, { status: 400 });
  }

  // Determine amount — project orders use plan price (possibly per-chapter),
  // other services use whatever was originally calculated and stored.
  let amountKobo = order.plan.priceKobo;
  if (order.plan.pricingType === "PER_CHAPTER" && (order as any).selectedChapters) {
    const chapterCount = (order as any).selectedChapters.split(",").filter(Boolean).length;
    amountKobo = order.plan.priceKobo * chapterCount;
  }
  // For other services, amountPaidKobo (if previously set) reflects the
  // exact original total including any add-ons — prefer that if present
  if ((order as any).amountPaidKobo) {
    amountKobo = (order as any).amountPaidKobo;
  }

  // International students retrying should go through Flutterwave, not Paystack
  const isInternational = (order as any).currency && (order as any).currency !== "NGN";

  if (isInternational) {
    const flutterwaveRes = await fetch("https://api.flutterwave.com/v3/payments", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref:      `IPM-RETRY-${order.id}-${Date.now()}`,
        amount:      amountKobo / 100,
        currency:    (order as any).currency,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/inprogress`,
        customer: { email: session.user.email, name: session.user.name },
        meta: { orderId: order.id, isRetry: true },
      }),
    });
    const flutterwaveData = await flutterwaveRes.json();
    if (flutterwaveData.status !== "success") {
      return NextResponse.json({ error: "Could not initialize payment. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ success: true, paymentUrl: flutterwaveData.data.link });
  }

  // Default: Paystack (NGN)
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
        orderId: order.id,
        isRetry: true,
        chaptersRequested: (order as any).selectedChapters ? (order as any).selectedChapters.split(",").map(Number) : [],
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/inprogress`,
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackData.status) {
    return NextResponse.json({ error: "Payment initialization failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, paymentUrl: paystackData.data.authorization_url });
}
