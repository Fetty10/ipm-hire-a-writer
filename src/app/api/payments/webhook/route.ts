export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { assignChaptersForOrder, assignSpecificChapters } from "@/lib/assignment";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const hash   = crypto.createHmac("sha512", secret).update(body).digest("hex");

  if (hash !== signature) {
    console.error("[WEBHOOK] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  console.log("[WEBHOOK] Event received:", event.event);

  if (event.event === "charge.success") {
    const { reference, amount, metadata } = event.data;

    console.log("[WEBHOOK] Raw metadata:", JSON.stringify(metadata));

    // Paystack can send metadata as object or JSON string
    let meta: any = {};
    if (typeof metadata === "string") {
      try { meta = JSON.parse(metadata); } catch { meta = {}; }
    } else if (metadata && typeof metadata === "object") {
      meta = metadata;
    }

    console.log("[WEBHOOK] Parsed meta:", JSON.stringify(meta));
    console.log("[WEBHOOK] isAddChapters:", meta?.isAddChapters);
    console.log("[WEBHOOK] addChapters:", meta?.addChapters);
    console.log("[WEBHOOK] orderId:", meta?.orderId);

    const orderId = meta?.orderId as string;

    if (!orderId) {
      console.error("[WEBHOOK] No orderId in metadata");
      return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      console.error("[WEBHOOK] Order not found:", orderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("[WEBHOOK] Order status:", order.status);

    // ── Add chapters — MUST be before status guard ──
    if (meta?.isAddChapters === true && Array.isArray(meta?.addChapters) && meta.addChapters.length > 0) {
      console.log("[WEBHOOK] Processing add-chapters:", meta.addChapters);
      await prisma.order.update({
        where: { id: orderId },
        data:  { amountPaidKobo: { increment: amount } },
      });
      await assignSpecificChapters(orderId, meta.addChapters);
      console.log("[WEBHOOK] Add-chapters done");
      return NextResponse.json({ ok: true, note: "Additional chapters assigned." });
    }

    // ── New order ──
    if (order.status !== "PENDING_PAYMENT") {
      console.log("[WEBHOOK] Already processed, skipping");
      return NextResponse.json({ ok: true, note: "Already processed" });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paystackReference: reference,
        amountPaidKobo:    amount,
        paidAt:            new Date(),
        status:            "PAYMENT_CONFIRMED",
      },
    });

    await assignChaptersForOrder(orderId);

    await prisma.order.update({
      where: { id: orderId },
      data:  { status: "IN_PROGRESS" },
    });

    console.log("[WEBHOOK] New order processed:", orderId);
  }

  return NextResponse.json({ ok: true });
}
