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
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.event === "charge.success") {
    const { reference, amount, metadata } = event.data;
    const meta     = typeof metadata === "string" ? JSON.parse(metadata) : (metadata || {});
    const orderId  = meta?.orderId as string;

    if (!orderId) {
      return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ── Add chapters to existing order — check BEFORE the status guard ──
    if (meta?.isAddChapters === true && Array.isArray(meta?.addChapters) && meta.addChapters.length > 0) {
      await prisma.order.update({
        where: { id: orderId },
        data:  { amountPaidKobo: { increment: amount } },
      });
      await assignSpecificChapters(orderId, meta.addChapters);
      return NextResponse.json({ ok: true, note: "Additional chapters assigned." });
    }

    // ── New order — guard against double processing ──
    if (order.status !== "PENDING_PAYMENT") {
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
  }

  return NextResponse.json({ ok: true });
}
