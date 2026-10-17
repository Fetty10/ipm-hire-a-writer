// src/app/api/orders/route.ts
// Creates a new order and initialises a Flutterwave payment (Nigerian students)
// For international students, /api/payments/flutterwave handles payment separately.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { randomUUID }                from "crypto";

// ─── Flutterwave v3 ───────────────────────────────────────────────────────────
const FLW_BASE    = "https://api.flutterwave.com/v3";
const FLW_KEY     = process.env.FLUTTERWAVE_SECRET_KEY!;
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL || "https://hire.iprojectmaster.com";

interface FlwInitResponse {
  status: string;
  message: string;
  data: { link: string };
}

async function initFlutterwavePayment(opts: {
  txRef:    string;
  amount:   number;        // Naira (whole number)
  currency: string;        // "NGN"
  email:    string;
  name:     string;
  phone?:   string;
  meta:     Record<string, string | number | undefined>;
}) {
  const body = {
    tx_ref:          opts.txRef,
    amount:          opts.amount,
    currency:        opts.currency,
    redirect_url:    `${APP_URL}/api/payments/callback`,
    customer: {
      email:         opts.email,
      name:          opts.name,
      phonenumber:   opts.phone ?? "",
    },
    meta:            opts.meta,
    customizations: {
      title:  "iProjectMaster",
      description: "Academic project writing service",
      logo:   `${APP_URL}/logo.png`,
    },
  };

  const res = await fetch(`${FLW_BASE}/payments`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${FLW_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flutterwave error ${res.status}: ${text}`);
  }

  const data: FlwInitResponse = await res.json();
  if (data.status !== "success") throw new Error(data.message || "Flutterwave init failed");
  return data.data.link;
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const body = await req.json();
    const {
      planId,
      topic,
      department,
      degreeGroup,
      specialInstructions,
      quantity,
      requiresPlagiarismCheck,
      guidelineFileUrl,
      chaptersRequested,
      serviceType,
      currency = "NGN",
      amount,           // total in whole Naira (frontend sends this)
    } = body;

    // ── Resolve amount in Naira ──────────────────────────────────────────────
    // Frontend calculates total and sends it as `amount` in the display currency.
    // For Nigeria (NGN) amounts are already in Naira. Convert if needed.
    let amountNaira: number;
    if (currency === "NGN") {
      amountNaira = Math.round(Number(amount));
    } else {
      // Fallback: look up price from plan for non-NGN (shouldn't normally
      // reach this path since international users use /api/payments/flutterwave)
      const plan = planId && planId !== "flat"
        ? await prisma.plan.findUnique({ where: { id: planId } })
        : null;
      amountNaira = plan ? Math.round(plan.priceKobo / 100) : Math.round(Number(amount));
    }

    if (!amountNaira || amountNaira <= 0) {
      return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
    }

    // ── Determine customer identity ──────────────────────────────────────────
    let customerEmail: string;
    let customerName:  string;
    let userId:        string | null = null;

    if (session?.user) {
      customerEmail = session.user.email!;
      customerName  = session.user.name  || "Student";
      userId        = session.user.id    || null;
    } else {
      // Register flow — guest checkout; account details come from the
      // registration form and are passed by the register page's onPayload handler
      customerEmail = body.email       || "student@iprojectmaster.com";
      customerName  = body.name        || "Student";
    }

    // ── Create order (PENDING) ───────────────────────────────────────────────
    const txRef = `ipm-${randomUUID()}`;

    const chaptersArray: number[] = Array.isArray(chaptersRequested)
      ? chaptersRequested.map(Number)
      : [];

    // Resolve planId — "flat" means a flat-fee service (no plan row)
    const resolvedPlanId = planId && planId !== "flat" ? planId : null;

    const order = await prisma.order.create({
      data: {
        userId:                 userId,
        planId:                 resolvedPlanId,
        topic:                  topic || "",
        department:             department || "",
        degreeGroup:            degreeGroup || "",
        serviceType:            serviceType || "HIRE_WRITER",
        specialInstructions:    specialInstructions || null,
        quantity:               quantity ? Number(quantity) : 1,
        requiresPlagiarismCheck: requiresPlagiarismCheck || false,
        guidelineFileUrl:       guidelineFileUrl || null,
        chaptersRequested:      chaptersArray,
        status:                 "PENDING",
        paymentStatus:          "PENDING",
        amountKobo:             amountNaira * 100,  // store in kobo for consistency
        currency:               currency,
        paystackReference:      txRef,              // reuse column — stores our tx_ref
      },
    });

    // ── Initialise Flutterwave payment ───────────────────────────────────────
    const paymentUrl = await initFlutterwavePayment({
      txRef,
      amount:   amountNaira,
      currency: "NGN",
      email:    customerEmail,
      name:     customerName,
      meta: {
        orderId:   order.id,
        serviceType,
        degreeGroup,
      },
    });

    return NextResponse.json({ success: true, paymentUrl, orderId: order.id });
  } catch (err: any) {
    console.error("[orders/POST]", err);
    return NextResponse.json(
      { error: "Payment initialization failed. Please try again." },
      { status: 500 }
    );
  }
}
