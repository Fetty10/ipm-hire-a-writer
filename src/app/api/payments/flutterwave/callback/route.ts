export const dynamic = "force-dynamic";
// src/app/api/payments/flutterwave/callback/route.ts
// Flutterwave redirects here after payment

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignChaptersForOrder } from "@/lib/assignment";

const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY!;
const APP_URL    = process.env.NEXTAUTH_URL || "https://hire.iprojectmaster.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status    = searchParams.get("status");
  const tx_ref    = searchParams.get("tx_ref");
  const tx_id     = searchParams.get("transaction_id");

  if (status !== "successful" || !tx_ref || !tx_id) {
    return NextResponse.redirect(`${APP_URL}/student/inprogress?error=payment_failed`);
  }

  // Verify with Flutterwave
  const verRes  = await fetch(`https://api.flutterwave.com/v3/transactions/${tx_id}/verify`, {
    headers: { "Authorization": `Bearer ${FLW_SECRET}` },
  });
  const verData = await verRes.json();

  if (verData.data?.status !== "successful") {
    return NextResponse.redirect(`${APP_URL}/student/inprogress?error=payment_failed`);
  }

  // Find order by tx_ref
  const order = await prisma.order.findFirst({
    where: { flutterwaveReference: tx_ref } as any,
  });

  if (!order || order.status !== "PENDING_PAYMENT") {
    return NextResponse.redirect(`${APP_URL}/student/inprogress`);
  }

  // Confirm payment
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status:               "PAYMENT_CONFIRMED",
      paidAt:               new Date(),
      amountPaidKobo:       Math.round(verData.data.amount * 100),
      flutterwaveStatus:    "successful",
    } as any,
  });

  // Assign chapters
  await assignChaptersForOrder(order.id);
  await prisma.order.update({ where: { id: order.id }, data: { status: "IN_PROGRESS" } });

  // Notify student
  await prisma.notification.create({
    data: {
      userId:  order.clientId,
      orderId: order.id,
      title:   "✅ Payment Confirmed — Work Started",
      message: `Your payment for "${order.topic}" has been confirmed. Your order is now in progress!`,
      type:    "INFO",
    },
  });

  return NextResponse.redirect(`${APP_URL}/student/inprogress?paid=1`);
}
