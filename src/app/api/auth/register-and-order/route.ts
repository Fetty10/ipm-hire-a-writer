export const dynamic = "force-dynamic";
// src/app/api/auth/register-and-order/route.ts
// Combined registration + order placement for new students arriving from iprojectmaster.com
// Creates account, places order, initializes payment — all in one request

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const {
      // Account fields
      name, email, phone, password,
      // Order fields
      planId, topic, department, degreeGroup,
      specialInstructions, guidelineFileUrl,
      chaptersRequested, serviceType,
      requiresPlagiarismCheck, quantity,
      // Payment method
      paymentMethod, // "PAYSTACK" | "BANK_TRANSFER" | "FLUTTERWAVE"
      currency,      // for Flutterwave
    } = await req.json();

    // ── Validate account fields ───────────────────────────────
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return NextResponse.json({ error: "Name, email, WhatsApp number and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (!topic?.trim() || !degreeGroup) {
      return NextResponse.json({ error: "Topic and degree level are required." }, { status: 400 });
    }

    // ── Check for existing email ──────────────────────────────
    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "EMAIL_EXISTS" }, { status: 409 });
    }

    // ── Create account ────────────────────────────────────────
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name:       name.trim(),
        email:      email.trim().toLowerCase(),
        phone:      phone.trim(),
        password:   hash,
        role:       Role.CLIENT,
        isApproved: true,
      } as any,
    });

    // ── Find plan ─────────────────────────────────────────────
    const isProjectService = !!(planId && planId !== "flat");
    let plan: any = null;
    let amountKobo = 0;
    let finalServiceType = serviceType || "HIRE_WRITER";

    if (isProjectService) {
      plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan || !plan.isActive) {
        await prisma.user.delete({ where: { id: user.id } });
        return NextResponse.json({ error: "Selected plan is not available." }, { status: 404 });
      }
      amountKobo = plan.priceKobo;
      if (plan.pricingType === "PER_CHAPTER" && chaptersRequested?.length) {
        amountKobo = plan.priceKobo * chaptersRequested.length;
      }
    } else {
      // Flat service
      plan = await prisma.plan.findFirst({ orderBy: { updatedAt: "asc" } });
      if (!plan) { await prisma.user.delete({ where: { id: user.id } }); return NextResponse.json({ error: "No plans configured." }, { status: 400 }); }

      const svcValueMap: Record<string,string> = {
        PROPOSAL_SEMINAR: "seminar", JOURNAL_WRITING: "journal",
        JOURNAL_SOURCING: "journal_sourcing", TOPIC_SUGGESTION: "topic",
        HIRE_WRITER: "assignment",
      };
      const svcValue = svcValueMap[finalServiceType] || finalServiceType?.toLowerCase();
      const svc = await (prisma as any).otherService.findFirst({ where: { value: svcValue, isActive: true } });
      const priceMap: Record<string,number> = {
        OND_HND_NCE: svc?.priceOND || 0, BSC_BED_BA: svc?.priceBSC || 0,
        PGD_MSC_PHD: svc?.pricePGD || 0, PHD: svc?.pricePHD || svc?.pricePGD || 0,
      };
      amountKobo = priceMap[degreeGroup] || 0;
      if (requiresPlagiarismCheck && svc) {
        const addOnMap: Record<string,number> = {
          OND_HND_NCE: svc.plagiarismAddOnOND || 0, BSC_BED_BA: svc.plagiarismAddOnBSC || 0,
          PGD_MSC_PHD: svc.plagiarismAddOnPGD || 0, PHD: svc.plagiarismAddOnPHD || 0,
        };
        amountKobo += addOnMap[degreeGroup] || 0;
      }
    }

    // ── Bank Transfer ─────────────────────────────────────────
    if (paymentMethod === "BANK_TRANSFER") {
      const reference = `IPM-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
      const order = await prisma.order.create({
        data: {
          clientId: user.id, planId: plan.id,
          topic: topic.trim(), department: department?.trim() || "",
          degreeGroup, specialInstructions: specialInstructions?.trim() || null,
          guidelineFileUrl: guidelineFileUrl || null,
          selectedChapters: chaptersRequested?.length ? chaptersRequested.sort().join(",") : null,
          serviceType: isProjectService ? "HIRE_WRITER" : finalServiceType,
          status: "PENDING_PAYMENT", paymentMethod: "BANK_TRANSFER",
          bankTransferReference: reference, amountPaidKobo: amountKobo,
          requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
          requiresAiCheck: isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
        } as any,
      });

      // Get bank account details
      const bankAccount = await (prisma as any).bankAccount.findFirst();

      // Notify admin
      const admins = await prisma.user.findMany({ where: { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } }, select: { id: true } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(a => ({ userId: a.id, orderId: order.id, title: "🏦 New Bank Transfer Order", message: `"${topic.trim()}" — Ref: ${reference}. Amount: ₦${(amountKobo/100).toLocaleString()}.`, type: "ACTION_REQUIRED" as const })),
        });
      }
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY!);
        await resend.emails.send({
          from: "iProjectMaster <noreply@hire.iprojectmaster.com>",
          to: "payment.iprojectmaster@gmail.com",
          subject: `🏦 New Bank Transfer — ₦${(amountKobo/100).toLocaleString()} (Ref: ${reference})`,
          html: `<div style="font-family:sans-serif;padding:1.5rem;"><h2>🏦 New Bank Transfer Order</h2><p><strong>Topic:</strong> ${topic.trim()}</p><p><strong>Amount:</strong> ₦${(amountKobo/100).toLocaleString()}</p><p><strong>Reference:</strong> ${reference}</p><p><strong>Student:</strong> ${name.trim()} (${email.trim()})</p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/bank-transfers" style="display:inline-block;margin-top:1rem;padding:.7rem 1.5rem;background:#38BDF8;color:#0C1A2E;font-weight:700;border-radius:10px;text-decoration:none;">Go to Bank Transfers →</a></div>`,
        });
      } catch (e) { console.error("[EMAIL] Bank transfer admin notify:", e); }

      return NextResponse.json({ success: true, paymentMethod: "BANK_TRANSFER", reference, amountNaira: amountKobo / 100, bankAccount, orderId: order.id, userId: user.id });
    }

    // ── Flutterwave (international) ───────────────────────────
    if (paymentMethod === "FLUTTERWAVE") {
      const order = await prisma.order.create({
        data: {
          clientId: user.id, planId: plan.id, topic: topic.trim(),
          department: department?.trim() || "", degreeGroup,
          specialInstructions: specialInstructions?.trim() || null,
          guidelineFileUrl: guidelineFileUrl || null,
          selectedChapters: chaptersRequested?.length ? chaptersRequested.sort().join(",") : null,
          serviceType: isProjectService ? "HIRE_WRITER" : finalServiceType,
          status: "PENDING_PAYMENT", currency: currency || "USD",
          requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : false,
          requiresAiCheck: isProjectService ? plan.includesPlagiarismCheck : false,
        } as any,
      });

      const tx_ref = `IPM-FLW-${order.id}-${Date.now()}`;
      const flutterwaveRes = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref, amount: amountKobo / 100, currency: currency || "USD",
          redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/flutterwave/callback`,
          customer: { email: email.trim(), name: name.trim() },
          meta: { orderId: order.id },
        }),
      });
      const flutterwaveData = await flutterwaveRes.json();
      if (flutterwaveData.status !== "success") {
        await prisma.order.delete({ where: { id: order.id } });
        await prisma.user.delete({ where: { id: user.id } });
        return NextResponse.json({ error: "Payment initialization failed." }, { status: 500 });
      }
      return NextResponse.json({ success: true, paymentMethod: "FLUTTERWAVE", paymentUrl: flutterwaveData.data.link, orderId: order.id, userId: user.id });
    }

    // ── Paystack (default, NGN) ────────────────────────────────
    const order = await prisma.order.create({
      data: {
        clientId: user.id, planId: plan.id, topic: topic.trim(),
        department: department?.trim() || "", degreeGroup,
        specialInstructions: specialInstructions?.trim() || null,
        guidelineFileUrl: guidelineFileUrl || null,
        selectedChapters: chaptersRequested?.length ? chaptersRequested.sort().join(",") : null,
        serviceType: isProjectService ? "HIRE_WRITER" : finalServiceType,
        status: "PENDING_PAYMENT",
        requiresPlagiarismCheck: isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
        requiresAiCheck: isProjectService ? plan.includesPlagiarismCheck : !!requiresPlagiarismCheck,
      } as any,
    });

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(), amount: amountKobo, currency: "NGN",
        metadata: { orderId: order.id, studentName: name.trim(), topic, chaptersRequested: chaptersRequested || [] },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/inprogress`,
      }),
    });
    const paystackData = await paystackRes.json();
    if (!paystackData.status) {
      await prisma.order.delete({ where: { id: order.id } });
      await prisma.user.delete({ where: { id: user.id } });
      return NextResponse.json({ error: "Payment initialization failed. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, paymentMethod: "PAYSTACK", paymentUrl: paystackData.data.authorization_url, reference: paystackData.data.reference, orderId: order.id, userId: user.id });

  } catch (err: any) {
    console.error("[REGISTER-AND-ORDER]", err?.message);
    return NextResponse.json({ error: err?.message || "Something went wrong." }, { status: 500 });
  }
}

// ── Quick email check endpoint ────────────────────────────────
export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ exists: false });
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  return NextResponse.json({ exists: !!user });
}
