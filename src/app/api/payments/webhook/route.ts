// src/app/api/payments/webhook/route.ts
// Flutterwave webhook handler
// Flutterwave sends a POST with header "verif-hash" (plain string, not HMAC)
// Event we care about: charge.completed

import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";
import { triggerAssignment }         from "@/lib/assignment";

export async function POST(req: NextRequest) {
  try {
    // ── Verify webhook secret ────────────────────────────────────────────────
    const hash = req.headers.get("verif-hash");
    if (!hash || hash !== process.env.FLW_WEBHOOK_HASH) {
      console.warn("[webhook] Invalid verif-hash");
      return NextResponse.json({ status: "ignored" }, { status: 200 });
      // Return 200 so Flutterwave doesn't keep retrying; just silently ignore
    }

    const event = await req.json();
    console.log("[webhook] event:", event?.event, event?.data?.tx_ref);

    // ── Only handle successful charges ───────────────────────────────────────
    if (event?.event !== "charge.completed") {
      return NextResponse.json({ status: "ignored" });
    }

    const data = event.data;
    if (data?.status !== "successful") {
      console.log("[webhook] charge not successful, status:", data?.status);
      return NextResponse.json({ status: "ignored" });
    }

    const txRef = data.tx_ref as string;
    if (!txRef) {
      return NextResponse.json({ status: "ignored" });
    }

    // ── Find the order ───────────────────────────────────────────────────────
    // tx_ref is stored in paystackReference column (no migration needed)
    const order = await prisma.order.findUnique({
      where: { paystackReference: txRef },
    });

    if (!order) {
      console.error("[webhook] Order not found for tx_ref:", txRef);
      return NextResponse.json({ status: "not_found" }, { status: 200 });
    }

    if (order.paymentStatus === "PAID") {
      // Already processed — idempotency guard
      return NextResponse.json({ status: "already_processed" });
    }

    // ── Verify amount (Flutterwave sends amount in Naira) ────────────────────
    const paidNaira     = Number(data.amount);
    const expectedNaira = order.amountKobo / 100;

    if (paidNaira < expectedNaira) {
      console.error(
        `[webhook] Amount mismatch: paid ₦${paidNaira}, expected ₦${expectedNaira}, order ${order.id}`
      );
      // Mark as suspicious but don't activate
      await prisma.order.update({
        where: { id: order.id },
        data:  { paymentStatus: "FAILED", status: "CANCELLED" },
      });
      return NextResponse.json({ status: "amount_mismatch" });
    }

    // ── Mark as paid and trigger assignment ──────────────────────────────────
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status:        "ACTIVE",
        paidAt:        new Date(),
      },
    });

    // Trigger job assignment (writer, analyst, QC)
    await triggerAssignment(order.id);

    console.log("[webhook] Order activated:", order.id);
    return NextResponse.json({ status: "ok" });

  } catch (err: any) {
    console.error("[webhook] Error:", err);
    // Return 200 to prevent Flutterwave from hammering retries
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
