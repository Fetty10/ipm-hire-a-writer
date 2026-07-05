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

    // Normalise metadata
    let meta: any = {};
    if (typeof metadata === "string") {
      try { meta = JSON.parse(metadata); } catch { meta = {}; }
    } else if (metadata && typeof metadata === "object") {
      meta = metadata;
    }

    const isAdd             = meta?.isAddChapters === true || meta?.isAddChapters === "true";
    const addChs            = Array.isArray(meta?.addChapters)
      ? meta.addChapters.map(Number).filter((n: number) => !isNaN(n))
      : [];
    const isNewRegistration = meta?.isNewRegistration === true || meta?.isNewRegistration === "true";

    // ── New registration via register page ───────────────────
    // Account is created here (after payment) not before, so cancelling
    // payment leaves no orphaned account.
    if (isNewRegistration) {
      const { name, email, phone, password, planId, topic, department, degreeGroup,
              specialInstructions, guidelineFileUrl, selectedChapters, serviceType,
              requiresPlagiarismCheck } = meta;

      // Idempotency — webhook can fire twice
      let user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!user) {
        const bcrypt = await import("bcryptjs");
        const hash   = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
          data: { name, email, phone, password: hash, role: "CLIENT" as any, isApproved: true } as any,
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
          paystackReference:     reference,
          amountPaidKobo:        amount,
          paidAt:                new Date(),
          requiresPlagiarismCheck: !!requiresPlagiarismCheck,
          requiresAiCheck:       !!requiresPlagiarismCheck,
        } as any,
      });

      await assignChaptersForOrder(order.id);
      await prisma.order.update({ where: { id: order.id }, data: { status: "IN_PROGRESS" } as any });

      return NextResponse.json({ ok: true, note: "New registration order created." });
    }

    const orderId = meta?.orderId as string;
    if (!orderId) {
      return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ── Add chapters — check BEFORE status guard ──────────────
    if (isAdd && addChs.length > 0) {
      await prisma.order.update({
        where: { id: orderId },
        data:  { amountPaidKobo: { increment: amount } },
      });
      await assignSpecificChapters(orderId, addChs);
      return NextResponse.json({ ok: true });
    }

    // ── New order — guard against double processing ────────────
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
