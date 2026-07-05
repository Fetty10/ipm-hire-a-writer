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
  const status = searchParams.get("status");
  const tx_ref = searchParams.get("tx_ref");
  const tx_id  = searchParams.get("transaction_id");

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

  const meta = verData.data?.meta || {};

  // ── New registration via register page ───────────────────
  if (meta.isNewRegistration) {
    const { name, email, phone, password, planId, topic, department, degreeGroup,
            specialInstructions, guidelineFileUrl, selectedChapters, serviceType,
            requiresPlagiarismCheck } = meta;

    // Check if already processed (callback can fire twice)
    let user = await prisma.user.findUnique({ where:{ email }, select:{ id:true } });
    if (!user) {
      const bcrypt = await import("bcryptjs");
      const hash   = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: { name, email, phone, password:hash, role:"CLIENT" as any, isApproved:true } as any,
      });
    }

    const existingOrder = await prisma.order.findFirst({
      where: { clientId:user.id, status:{ not:"PENDING_PAYMENT" } },
    });
    if (existingOrder) {
      return NextResponse.redirect(`${APP_URL}/student/inprogress?paid=1`);
    }

    const plan = await prisma.plan.findFirst({ where:{ isActive:true }, orderBy:{ priceKobo:"asc" } });
    if (!plan) return NextResponse.redirect(`${APP_URL}/student/inprogress?error=no_plan`);

    const order = await prisma.order.create({
      data: {
        clientId:            user.id,
        planId:              planId && planId !== "flat" ? planId : plan.id,
        topic, department:   department||"", degreeGroup,
        specialInstructions: specialInstructions||null,
        guidelineFileUrl:    guidelineFileUrl||null,
        selectedChapters:    selectedChapters||null,
        serviceType:         serviceType||"HIRE_WRITER",
        status:              "PAYMENT_CONFIRMED",
        flutterwaveReference: tx_ref,
        paidAt:              new Date(),
        amountPaidKobo:      Math.round(verData.data.amount * 100),
        flutterwaveStatus:   "successful",
        requiresPlagiarismCheck: !!requiresPlagiarismCheck,
        requiresAiCheck:     !!requiresPlagiarismCheck,
      } as any,
    });

    await assignChaptersForOrder(order.id);
    await prisma.order.update({ where:{ id:order.id }, data:{ status:"IN_PROGRESS" } as any });

    await prisma.notification.create({
      data: {
        userId:  user.id,
        orderId: order.id,
        title:   "✅ Payment Confirmed — Work Started",
        message: `Your payment for "${topic}" has been confirmed. Your order is now in progress!`,
        type:    "INFO",
      },
    });

    return NextResponse.redirect(`${APP_URL}/student/inprogress?paid=1`);
  }

  // ── Existing order payment ────────────────────────────────
  const order = await prisma.order.findFirst({
    where: { flutterwaveReference: tx_ref } as any,
  });

  if (!order || order.status !== "PENDING_PAYMENT") {
    return NextResponse.redirect(`${APP_URL}/student/inprogress`);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status:              "PAYMENT_CONFIRMED",
      paidAt:              new Date(),
      amountPaidKobo:      Math.round(verData.data.amount * 100),
      flutterwaveStatus:   "successful",
    } as any,
  });

  await assignChaptersForOrder(order.id);
  await prisma.order.update({ where:{ id:order.id }, data:{ status:"IN_PROGRESS" } as any });

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
