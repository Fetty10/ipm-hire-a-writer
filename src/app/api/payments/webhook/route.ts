export const dynamic = "force-dynamic";
// src/app/api/payments/webhook/route.ts
// Flutterwave webhook — handles charge.completed events

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { assignChaptersForOrder, assignSpecificChapters } from "@/lib/assignment";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("verif-hash");

  // Flutterwave uses a secret hash you set in the dashboard
  // (FLW_WEBHOOK_HASH env var) rather than an HMAC
  const secret = process.env.FLW_WEBHOOK_HASH!;
  if (signature !== secret) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Flutterwave fires "charge.completed" for successful payments
  if (event.event === "charge.completed" && event.data?.status === "successful") {
    const { tx_ref, amount, meta, customer } = event.data;

    // Normalise meta
    let parsedMeta: any = {};
    if (typeof meta === "string") {
      try { parsedMeta = JSON.parse(meta); } catch { parsedMeta = {}; }
    } else if (meta && typeof meta === "object") {
      parsedMeta = meta;
    }

    // amount from Flutterwave is in Naira — convert to kobo
    const amountKobo = Math.round(amount * 100);

    const isAdd             = parsedMeta?.isAddChapters === true || parsedMeta?.isAddChapters === "true";
    const addChs            = Array.isArray(parsedMeta?.addChapters)
      ? parsedMeta.addChapters.map(Number).filter((n: number) => !isNaN(n))
      : [];
    const isNewRegistration = parsedMeta?.isNewRegistration === true || parsedMeta?.isNewRegistration === "true";

    // ── New registration via register page ───────────────────────
    if (isNewRegistration) {
      const { name, email, phone, password, planId, topic, department, degreeGroup,
              specialInstructions, guidelineFileUrl, selectedChapters, serviceType,
              requiresPlagiarismCheck } = parsedMeta;

      // Idempotency — webhook can fire twice
      let user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!user) {
        const bcrypt = await import("bcryptjs");
        const hashed = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
          data: { name, email, phone, password: hashed, role: "CLIENT" as any, isApproved: true } as any,
        });
      }

      const existingOrder = await prisma.order.findFirst({
        where: { clientId: user.id, status: { not: "PENDING_PAYMENT" } },
      });
      if (existingOrder) {
        return NextResponse.json({ ok: true, note: "Already processed" });
      }

      const plan = await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { priceKobo: "asc" } });
      if (!plan) return NextResponse.json({ error: "No plan found" }, { status: 500 });

      const order = await prisma.order.create({
        data: {
          clientId:              user.id,
          planId:                planId && planId !== "flat" ? planId : plan.id,
          topic, department:     department || "", degreeGroup,
          specialInstructions:   specialInstructions || null,
          guidelineFileUrl:      guidelineFileUrl || null,
          selectedChapters:      selectedChapters || null,
          serviceType:           serviceType || "HIRE_WRITER",
          status:                "PAYMENT_CONFIRMED",
          flutterwaveReference:  tx_ref,
          amountPaidKobo:        amountKobo,
          paidAt:                new Date(),
          requiresPlagiarismCheck: !!requiresPlagiarismCheck,
          requiresAiCheck:       !!requiresPlagiarismCheck,
        } as any,
      });

      await assignChaptersForOrder(order.id);
      await prisma.order.update({ where: { id: order.id }, data: { status: "IN_PROGRESS" } as any });

      return NextResponse.json({ ok: true, note: "New registration order created." });
    }

    const orderId = parsedMeta?.orderId as string;
    if (!orderId) {
      return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ── Add chapters ──────────────────────────────────────────────
    if (isAdd && addChs.length > 0) {
      await prisma.order.update({
        where: { id: orderId },
        data:  { amountPaidKobo: { increment: amountKobo } },
      });
      await assignSpecificChapters(orderId, addChs);
      return NextResponse.json({ ok: true });
    }

    // ── New order — guard against double processing ───────────────
    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ ok: true, note: "Already processed" });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        flutterwaveReference: tx_ref,
        amountPaidKobo:       amountKobo,
        paidAt:               new Date(),
        status:               "PAYMENT_CONFIRMED",
      } as any,
    });

    await assignChaptersForOrder(orderId);
    await prisma.order.update({
      where: { id: orderId },
      data:  { status: "IN_PROGRESS" },
    });
  }

  return NextResponse.json({ ok: true });
}
