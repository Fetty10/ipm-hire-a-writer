// src/app/api/payments/webhook/route.ts
// Paystack webhook — confirms payment and triggers job assignment

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { assignChaptersForOrder } from "@/lib/assignment";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  // ── Verify webhook signature ──────────────────────────────
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { reference, amount, metadata } = event.data;
    const orderId: string = metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Guard: already processed
    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ ok: true, note: "Already processed" });
    }

    // Confirm payment
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paystackReference: reference,
        amountPaidKobo:    amount, // Paystack sends amount in kobo already
        paidAt:            new Date(),
        status:            "PAYMENT_CONFIRMED",
      },
    });

    // Trigger assignment engine
    await assignChaptersForOrder(orderId);

    // Move to IN_PROGRESS
    await prisma.order.update({
      where: { id: orderId },
      data:  { status: "IN_PROGRESS" },
    });
  }

  return NextResponse.json({ ok: true });
}
