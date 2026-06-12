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
  console.log("[WEBHOOK] event:", event.event);

  if (event.event === "charge.success") {
    const { reference, amount, metadata } = event.data;

    console.log("[WEBHOOK] raw metadata:", JSON.stringify(metadata));

    // Normalise metadata — Paystack can send as object or JSON string
    let meta: any = {};
    if (typeof metadata === "string") {
      try { meta = JSON.parse(metadata); } catch { meta = {}; }
    } else if (metadata && typeof metadata === "object") {
      meta = metadata;
    }

    console.log("[WEBHOOK] parsed meta:", JSON.stringify(meta));

    const orderId  = meta?.orderId as string;
    // Handle isAddChapters as boolean OR string "true"
    const isAdd    = meta?.isAddChapters === true || meta?.isAddChapters === "true";
    const addChs   = Array.isArray(meta?.addChapters) ? meta.addChapters : [];

    console.log("[WEBHOOK] orderId:", orderId, "isAdd:", isAdd, "addChs:", addChs);

    if (!orderId) {
      console.error("[WEBHOOK] No orderId");
      return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      console.error("[WEBHOOK] Order not found:", orderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("[WEBHOOK] order status:", order.status);

    // ── Add chapters — BEFORE status guard ──────────────────
    if (isAdd && addChs.length > 0) {
      console.log("[WEBHOOK] Adding chapters:", addChs);
      await prisma.order.update({
        where: { id: orderId },
        data:  { amountPaidKobo: { increment: amount } },
      });
      await assignSpecificChapters(orderId, addChs.map(Number));
      console.log("[WEBHOOK] Chapters added successfully");
      return NextResponse.json({ ok: true, note: "Additional chapters assigned." });
    }

    // ── New order — guard ────────────────────────────────────
    if (order.status !== "PENDING_PAYMENT") {
      console.log("[WEBHOOK] Already processed");
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
