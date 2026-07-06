export const dynamic = "force-dynamic";
// src/app/api/auth/register-and-order/route.ts
// Combined registration + order placement for new students.
// For Paystack/Flutterwave: stores registration data in payment metadata,
// account is created in the webhook AFTER payment succeeds.
// For Bank Transfer: creates account immediately since admin manually confirms.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// ── Quick email check (GET) ───────────────────────────────────
export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ exists: false });
  const user = await prisma.user.findUnique({
    where:  { email: email.trim().toLowerCase() },
    select: { id: true },
  });
  return NextResponse.json({ exists: !!user });
}

// ── Helpers ───────────────────────────────────────────────────
async function resolveAmountKobo(planId: string, serviceType: string, degreeGroup: string, chaptersRequested: number[], requiresPlagiarismCheck: boolean, currency: string = "NGN") {
  const isProjectService = !!(planId && planId !== "flat");

  if (isProjectService) {
    // Use raw query to get international prices
    const plans = await prisma.$queryRaw<any[]>`
      SELECT id, "planName", "pricingType", "priceKobo", "isActive",
        "priceGHS"::integer, "priceKES"::integer, "priceUSD"::integer, "priceGBP"::integer,
        "includesPlagiarismCheck"
      FROM "Plan" WHERE id = ${planId} LIMIT 1
    `;
    const plan = plans[0];
    if (!plan || !plan.isActive) throw new Error("Selected plan is not available.");

    // Use international price if available, otherwise fall back to priceKobo
    let unitAmount = plan.priceKobo;
    if (currency !== "NGN") {
      const intlKey = `price${currency}`;
      const intlVal = plan[intlKey];
      if (intlVal) unitAmount = intlVal;
    }

    let amount = unitAmount;
    if (plan.pricingType === "PER_CHAPTER" && chaptersRequested?.length) {
      amount = unitAmount * chaptersRequested.length;
    }
    return { plan, amount };
  }

  const plan = await prisma.plan.findFirst({ orderBy: { updatedAt: "asc" } });
  if (!plan) throw new Error("No plans configured.");

  const svcValueMap: Record<string,string> = {
    PROPOSAL_SEMINAR:"seminar", JOURNAL_WRITING:"journal",
    JOURNAL_SOURCING:"journal_sourcing", TOPIC_SUGGESTION:"topic",
    HIRE_WRITER:"assignment",
  };
  const svcValue = svcValueMap[serviceType] || serviceType?.toLowerCase();
  const svc = await (prisma as any).otherService.findFirst({ where: { value: svcValue, isActive: true } });
  const degKey: Record<string,string> = { OND_HND_NCE:"OND", BSC_BED_BA:"BSC", PGD_MSC_PHD:"PGD", PHD:"PHD" };
  const dk = degKey[degreeGroup] || "BSC";

  // Use international price if available
  let amount = 0;
  if (currency !== "NGN" && svc) {
    const intlKey = `price${currency}${dk}`;
    const intlVal = svc[intlKey];
    if (intlVal) { amount = intlVal; }
  }
  if (!amount && svc) amount = (svc[`price${dk}`] || 0);
  if (requiresPlagiarismCheck && svc && currency === "NGN") {
    amount += (svc[`plagiarismAddOn${dk}`] || 0);
  }
  return { plan, amount };
}

// ── Main POST ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, email, phone, password,
      planId, topic, department, degreeGroup,
      specialInstructions, guidelineFileUrl,
      chaptersRequested, serviceType,
      requiresPlagiarismCheck, quantity,
      paymentMethod, currency,
    } = body;

    // ── Validate ──────────────────────────────────────────────
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return NextResponse.json({ error: "Name, email, WhatsApp and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (!topic?.trim() || !degreeGroup) {
      return NextResponse.json({ error: "Topic and degree level are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ── Email check ───────────────────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });

    // ── Resolve plan + amount ─────────────────────────────────
    const { plan, amount: amountKobo } = await resolveAmountKobo(
      planId, serviceType, degreeGroup, chaptersRequested || [], !!requiresPlagiarismCheck, currency || "NGN"
    );
    const isProjectService = !!(planId && planId !== "flat");

    // ── BANK TRANSFER — create account + order immediately ────
    if (paymentMethod === "BANK_TRANSFER") {
      const hash      = await bcrypt.hash(password, 10);
      const user      = await prisma.user.create({
        data: { name:name.trim(), email:cleanEmail, phone:phone.trim(), password:hash, role:Role.CLIENT, isApproved:true } as any,
      });

      const reference = `IPM-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
      const order = await prisma.order.create({
        data: {
          clientId:              user.id, planId: plan.id,
          topic:                 topic.trim(), department: department?.trim() || "",
          degreeGroup,
          specialInstructions:   specialInstructions?.trim() || null,
          guidelineFileUrl:      guidelineFileUrl || null,
          selectedChapters:      chaptersRequested?.length ? chaptersRequested.sort().join(",") : null,
          serviceType:           isProjectService ? "HIRE_WRITER" : serviceType,
          status:                "PENDING_PAYMENT",
          paymentMethod:         "BANK_TRANSFER",
          bankTransferReference: reference,
          amountPaidKobo:        amountKobo,
          requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
          requiresAiCheck:       isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
        } as any,
      });

      // Notify admin
      const admins = await prisma.user.findMany({ where: { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } }, select: { id:true } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(a => ({ userId:a.id, orderId:order.id, title:"🏦 New Bank Transfer Order", message:`"${topic.trim()}" — Ref: ${reference}. Amount: ₦${(amountKobo/100).toLocaleString()}.`, type:"ACTION_REQUIRED" as const })),
        });
      }
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY!);
        await resend.emails.send({
          from: "iProjectMaster <noreply@hire.iprojectmaster.com>",
          to:   "payment.iprojectmaster@gmail.com",
          subject: `🏦 New Bank Transfer — ₦${(amountKobo/100).toLocaleString()} (Ref: ${reference})`,
          html: `<div style="font-family:sans-serif;padding:1.5rem;"><h2>🏦 New Bank Transfer Order</h2><p><b>Topic:</b> ${topic.trim()}</p><p><b>Amount:</b> ₦${(amountKobo/100).toLocaleString()}</p><p><b>Ref:</b> ${reference}</p><p><b>Student:</b> ${name.trim()} (${cleanEmail})</p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/bank-transfers" style="display:inline-block;margin-top:1rem;padding:.7rem 1.5rem;background:#38BDF8;color:#0C1A2E;font-weight:700;border-radius:10px;text-decoration:none;">Go to Bank Transfers →</a></div>`,
        });
      } catch (e) { console.error("[EMAIL] Bank transfer notify:", e); }

      const bankAccount = await (prisma as any).bankAccount.findFirst();
      return NextResponse.json({ success:true, paymentMethod:"BANK_TRANSFER", reference, amountNaira:amountKobo/100, bankAccount, orderId:order.id });
    }

    // ── PAYSTACK / FLUTTERWAVE — store reg data in metadata ───
    // Account is NOT created yet — it's created in the webhook after payment succeeds.
    // This prevents orphaned accounts when students cancel payment.
    const regData = {
      name: name.trim(), email: cleanEmail, phone: phone.trim(), password,
      planId, topic: topic.trim(), department: department?.trim() || "",
      degreeGroup, specialInstructions: specialInstructions?.trim() || null,
      guidelineFileUrl: guidelineFileUrl || null,
      selectedChapters: chaptersRequested?.length ? chaptersRequested.sort().join(",") : null,
      serviceType: isProjectService ? "HIRE_WRITER" : serviceType,
      requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
      amountKobo,
      isNewRegistration: true,
    };

    if (paymentMethod === "FLUTTERWAVE") {
      const tx_ref = `IPM-REG-FLW-${Date.now()}`;
      console.log("[REG-FLW] amountKobo:", amountKobo, "currency:", currency, "amount to FLW:", amountKobo / 100);
      const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: { Authorization:`Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, "Content-Type":"application/json" },
        body: JSON.stringify({
          tx_ref, amount: amountKobo / 100, currency: currency || "USD",
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/flutterwave/callback`,
          customer: { email: cleanEmail, name: name.trim() },
          meta: { ...regData, tx_ref },
        }),
      });
      const flwData = await flwRes.json();
      if (flwData.status !== "success") return NextResponse.json({ error:"Payment initialization failed." }, { status:500 });
      return NextResponse.json({ success:true, paymentMethod:"FLUTTERWAVE", paymentUrl:flwData.data.link });
    }

    // Paystack (default)
    const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        email: cleanEmail, amount: amountKobo, currency: "NGN",
        metadata: { ...regData, studentName: name.trim() },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/inprogress`,
      }),
    });
    const psData = await psRes.json();
    if (!psData.status) return NextResponse.json({ error:"Payment initialization failed. Please try again." }, { status:500 });
    return NextResponse.json({ success:true, paymentMethod:"PAYSTACK", paymentUrl:psData.data.authorization_url, reference:psData.data.reference });

  } catch (err: any) {
    console.error("[REGISTER-AND-ORDER]", err?.message);
    return NextResponse.json({ error: err?.message || "Something went wrong." }, { status:500 });
  }
}
