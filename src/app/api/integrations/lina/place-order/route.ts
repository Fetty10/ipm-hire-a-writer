export const dynamic = "force-dynamic";
// src/app/api/integrations/lina/place-order/route.ts
// Lina-specific endpoint for placing orders on behalf of existing students.
// Auth: Bearer token (LINA_API_KEY env var)
// Identity: email + phone matched against existing account (phone used as password proxy)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LINA_API_KEY = process.env.LINA_API_KEY;

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization header." }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "").trim();
  if (!LINA_API_KEY || token !== LINA_API_KEY) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      email, phone,
      planId, topic, department, degreeGroup,
      specialInstructions, guidelineFileUrl,
      chaptersRequested, serviceType,
      requiresPlagiarismCheck, quantity,
      paymentMethod, currency,
    } = body;

    // ── Validate required fields ──────────────────────────
    if (!email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "email and phone are required for identity verification." }, { status: 400 });
    }
    if (!topic?.trim() || !degreeGroup) {
      return NextResponse.json({ error: "topic and degreeGroup are required." }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: "paymentMethod is required." }, { status: 400 });
    }

    // ── Verify student identity (email + phone) ───────────
    const student = await prisma.user.findUnique({
      where:  { email: email.trim().toLowerCase() },
      select: { id:true, name:true, email:true, phone:true, role:true, isApproved:true },
    });

    if (!student) {
      return NextResponse.json({ error: "No account found with that email address." }, { status: 404 });
    }
    if (student.role !== "CLIENT") {
      return NextResponse.json({ error: "This account is not a student account." }, { status: 403 });
    }
    if (!student.isApproved) {
      return NextResponse.json({ error: "This account is not yet approved." }, { status: 403 });
    }

    // Phone verification — normalize both for comparison
    const normalize = (p: string) => p.replace(/\D/g, "").replace(/^234/, "0");
    if (normalize(student.phone || "") !== normalize(phone.trim())) {
      return NextResponse.json({ error: "Phone number does not match our records for this email." }, { status: 401 });
    }

    // ── Resolve plan + amount ─────────────────────────────
    const isProjectService = !!(planId && planId !== "flat");
    let plan: any = null;
    let amountKobo = 0;
    const finalServiceType = serviceType || "HIRE_WRITER";

    if (isProjectService) {
      const plans = await prisma.$queryRaw<any[]>`
        SELECT id, "planName", "pricingType", "isActive",
          "priceKobo"::integer,
          "priceGHS"::integer, "priceKES"::integer,
          "priceUSD"::integer, "priceGBP"::integer,
          "includesPlagiarismCheck"
        FROM "Plan" WHERE id = ${planId} LIMIT 1
      `;
      plan = plans[0];
      if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "Selected plan is not available." }, { status: 404 });
      }

      const cur = currency || "NGN";
      let unitAmount = plan.priceKobo;
      if (cur !== "NGN") {
        const intlVal = plan[`price${cur}`];
        if (intlVal) unitAmount = intlVal;
      }
      amountKobo = unitAmount;
      if (plan.pricingType === "PER_CHAPTER" && chaptersRequested?.length) {
        amountKobo = unitAmount * chaptersRequested.length;
      }
    } else {
      // Flat / other service
      const fallback = await prisma.plan.findFirst({ orderBy: { updatedAt: "asc" } });
      if (!fallback) return NextResponse.json({ error: "No plans configured." }, { status: 500 });
      plan = fallback;

      const svcValueMap: Record<string,string> = {
        PROPOSAL_SEMINAR:"seminar", JOURNAL_WRITING:"journal",
        JOURNAL_SOURCING:"journal_sourcing", TOPIC_SUGGESTION:"topic",
        HIRE_WRITER:"assignment",
      };
      const svcValue = svcValueMap[finalServiceType] || finalServiceType.toLowerCase();
      const svc = await (prisma as any).otherService.findFirst({ where: { value: svcValue, isActive: true } });
      const degKey: Record<string,string> = { OND_HND_NCE:"OND", BSC_BED_BA:"BSC", PGD_MSC_PHD:"PGD", PHD:"PHD" };
      const dk = degKey[degreeGroup] || "BSC";
      const cur = currency || "NGN";

      if (cur !== "NGN" && svc) {
        const intlVal = svc[`price${cur}${dk}`];
        if (intlVal) { amountKobo = intlVal; }
      }
      if (!amountKobo && svc) amountKobo = svc[`price${dk}`] || 0;
      if (requiresPlagiarismCheck && svc && cur === "NGN") {
        amountKobo += svc[`plagiarismAddOn${dk}`] || 0;
      }
    }

    // ── Bank Transfer ─────────────────────────────────────
    if (paymentMethod === "BANK_TRANSFER") {
      const reference = `IPM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const order = await prisma.order.create({
        data: {
          clientId:              student.id,
          planId:                plan.id,
          topic:                 topic.trim(),
          department:            department?.trim() || "",
          degreeGroup,
          specialInstructions:   specialInstructions?.trim() || null,
          guidelineFileUrl:      guidelineFileUrl || null,
          selectedChapters:      chaptersRequested?.length ? chaptersRequested.sort().join(",") : null,
          serviceType:           isProjectService ? "HIRE_WRITER" : finalServiceType,
          status:                "PENDING_PAYMENT",
          paymentMethod:         "BANK_TRANSFER",
          bankTransferReference: reference,
          amountPaidKobo:        amountKobo,
          requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
          requiresAiCheck:       isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
        } as any,
      });

      // Notify admin
      const admins = await prisma.user.findMany({
        where:  { role: { in: ["MAIN_ADMIN", "SUB_ADMIN"] as any } },
        select: { id:true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(a => ({
            userId:  a.id,
            orderId: order.id,
            title:   "🏦 New Bank Transfer Order (via Lina)",
            message: `"${topic.trim()}" — Ref: ${reference}. Amount: ₦${(amountKobo/100).toLocaleString()}.`,
            type:    "ACTION_REQUIRED" as const,
          })),
        });
      }

      // Admin email
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY!);
        await resend.emails.send({
          from:    "iProjectMaster <noreply@hire.iprojectmaster.com>",
          to:      "payment.iprojectmaster@gmail.com",
          subject: `🏦 New Bank Transfer via Lina — ₦${(amountKobo/100).toLocaleString()} (Ref: ${reference})`,
          html:    `<div style="font-family:sans-serif;padding:1.5rem;">
            <h2>🏦 New Bank Transfer Order (via Lina)</h2>
            <p><b>Topic:</b> ${topic.trim()}</p>
            <p><b>Amount:</b> ₦${(amountKobo/100).toLocaleString()}</p>
            <p><b>Reference:</b> ${reference}</p>
            <p><b>Student:</b> ${student.name} (${student.email})</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/bank-transfers"
              style="display:inline-block;margin-top:1rem;padding:.7rem 1.5rem;background:#38BDF8;color:#0C1A2E;font-weight:700;border-radius:10px;text-decoration:none;">
              Go to Bank Transfers →
            </a>
          </div>`,
        });
      } catch (e) { console.error("[LINA] Admin email failed:", e); }

      const bankAccount = await (prisma as any).bankAccount.findFirst();

      return NextResponse.json({
        success:       true,
        paymentMethod: "BANK_TRANSFER",
        reference,
        amountNaira:   amountKobo / 100,
        bankAccount,
        orderId:       order.id,
        student: {
          name:  student.name,
          email: student.email,
        },
      });
    }

    // ── Flutterwave ───────────────────────────────────────
    if (paymentMethod === "FLUTTERWAVE") {
      const order = await prisma.order.create({
        data: {
          clientId:              student.id,
          planId:                plan.id,
          topic:                 topic.trim(),
          department:            department?.trim() || "",
          degreeGroup,
          specialInstructions:   specialInstructions?.trim() || null,
          guidelineFileUrl:      guidelineFileUrl || null,
          selectedChapters:      chaptersRequested?.length ? chaptersRequested.sort().join(",") : null,
          serviceType:           isProjectService ? "HIRE_WRITER" : finalServiceType,
          status:                "PENDING_PAYMENT",
          currency:              currency || "USD",
          requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : false,
          requiresAiCheck:       isProjectService ? plan.includesPlagiarismCheck : false,
        } as any,
      });

      const tx_ref  = `IPM-FLW-${order.id}-${Date.now()}`;
      const flwRes  = await fetch("https://api.flutterwave.com/v3/payments", {
        method:  "POST",
        headers: { Authorization:`Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, "Content-Type":"application/json" },
        body: JSON.stringify({
          tx_ref,
          amount:       amountKobo / 100,
          currency:     currency || "USD",
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/flutterwave/callback`,
          customer:     { email: student.email, name: student.name },
          meta:         { orderId: order.id },
        }),
      });
      const flwData = await flwRes.json();
      if (flwData.status !== "success") {
        await prisma.order.delete({ where: { id: order.id } });
        return NextResponse.json({ error: "Payment initialization failed." }, { status: 500 });
      }
      return NextResponse.json({
        success:       true,
        paymentMethod: "FLUTTERWAVE",
        paymentUrl:    flwData.data.link,
        orderId:       order.id,
        student: { name:student.name, email:student.email },
      });
    }

    // ── Paystack ──────────────────────────────────────────
    const order = await prisma.order.create({
      data: {
        clientId:              student.id,
        planId:                plan.id,
        topic:                 topic.trim(),
        department:            department?.trim() || "",
        degreeGroup,
        specialInstructions:   specialInstructions?.trim() || null,
        guidelineFileUrl:      guidelineFileUrl || null,
        selectedChapters:      chaptersRequested?.length ? chaptersRequested.sort().join(",") : null,
        serviceType:           isProjectService ? "HIRE_WRITER" : finalServiceType,
        status:                "PENDING_PAYMENT",
        requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
        requiresAiCheck:       isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
      } as any,
    });

    const psRes  = await fetch("https://api.paystack.co/transaction/initialize", {
      method:  "POST",
      headers: { Authorization:`Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        email:        student.email,
        amount:       amountKobo,
        currency:     "NGN",
        metadata:     { orderId: order.id, studentName: student.name, topic, chaptersRequested: chaptersRequested || [] },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/inprogress`,
      }),
    });
    const psData = await psRes.json();
    if (!psData.status) {
      await prisma.order.delete({ where: { id: order.id } });
      return NextResponse.json({ error: "Payment initialization failed." }, { status: 500 });
    }

    return NextResponse.json({
      success:       true,
      paymentMethod: "PAYSTACK",
      paymentUrl:    psData.data.authorization_url,
      reference:     psData.data.reference,
      orderId:       order.id,
      student: { name:student.name, email:student.email },
    });

  } catch (err: any) {
    console.error("[LINA PLACE ORDER]", err?.message);
    return NextResponse.json({ error: err?.message || "Something went wrong." }, { status: 500 });
  }
}
