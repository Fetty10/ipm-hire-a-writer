export const dynamic = "force-dynamic";
// src/app/api/orders/add-chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId: session.user.id },
    include: {
      plan: true,
      chapters: { select: { chapterNumber: true, status: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const existingChapterNums = order.chapters.map(ch => ch.chapterNumber);

  // Also exclude chapters that have an unconfirmed pending request
  const pendingRequests = await (prisma as any).pendingChapterRequest.findMany({
    where: { orderId, status: "PENDING_PAYMENT" },
  });
  const pendingNums = pendingRequests.flatMap((r: any) =>
    r.chapterNumbers.split(",").map(Number)
  );

  const unavailableNums   = [...new Set([...existingChapterNums, ...pendingNums])];
  const availableChapters = [1,2,3,4,5].filter(n => !unavailableNums.includes(n));

  return NextResponse.json({
    success: true,
    data: {
      orderId:          order.id,
      topic:            order.topic,
      department:       order.department,
      degreeGroup:      order.degreeGroup,
      planName:         order.plan.planName,
      pricePerChapter:  order.plan.priceKobo / 100,
      pricingType:      order.plan.pricingType,
      existingChapters: existingChapterNums,
      pendingChapters:  pendingNums,
      availableChapters,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, chaptersRequested, guidelineFileUrl, specialInstructions, paymentMethod } = await req.json();

  if (!orderId || !chaptersRequested?.length) {
    return NextResponse.json({ error: "orderId and chaptersRequested are required." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, clientId: session.user.id },
    include: {
      plan: true,
      chapters: { select: { chapterNumber: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Validate chapters aren't already ordered
  const existingNums = order.chapters.map(ch => ch.chapterNumber);
  const invalid = chaptersRequested.filter((n: number) => existingNums.includes(n));
  if (invalid.length > 0) {
    return NextResponse.json({ error: `Chapter(s) ${invalid.join(", ")} already exist on this order.` }, { status: 400 });
  }

  // Validate chapters aren't already in an unconfirmed pending request
  const pendingRequests = await (prisma as any).pendingChapterRequest.findMany({
    where: { orderId, status: "PENDING_PAYMENT" },
  });
  const alreadyPendingNums = pendingRequests.flatMap((r: any) =>
    r.chapterNumbers.split(",").map(Number)
  );
  const duplicatePending = chaptersRequested.filter((n: number) => alreadyPendingNums.includes(n));
  if (duplicatePending.length > 0) {
    return NextResponse.json({
      error: `Chapter(s) ${duplicatePending.join(", ")} already have a pending request awaiting payment confirmation. Please wait for admin to confirm, or contact support if you made the transfer more than 24 hours ago.`,
    }, { status: 409 });
  }

  // Calculate amount
  const amountKobo = order.plan.pricingType === "PER_CHAPTER"
    ? order.plan.priceKobo * chaptersRequested.length
    : order.plan.priceKobo;

  // Update guideline and special instructions if provided
  if (guidelineFileUrl || specialInstructions) {
    const data: any = {};
    if (guidelineFileUrl) {
      const existing = order.guidelineFileUrl;
      data.guidelineFileUrl = existing ? `${existing},${guidelineFileUrl}` : guidelineFileUrl;
    }
    if (specialInstructions) {
      const existingInstr = order.specialInstructions;
      data.specialInstructions = existingInstr
        ? `${existingInstr}\n\n[Additional chapters note]: ${specialInstructions}`
        : `[Additional chapters note]: ${specialInstructions}`;
    }
    await prisma.order.update({ where: { id: orderId }, data });
  }

  // ── Bank Transfer flow ──────────────────────────────────────
  if (paymentMethod === "BANK_TRANSFER") {
    const reference = `IPM-ADD-${Math.random().toString(36).slice(2,8).toUpperCase()}`;

    // Create a trackable pending request record for admin confirmation
    await (prisma as any).pendingChapterRequest.create({
      data: {
        orderId:          order.id,
        chapterNumbers:   chaptersRequested.join(","),
        amountKobo,
        reference,
        guidelineFileUrl: guidelineFileUrl || null,
        status:           "PENDING_PAYMENT",
      },
    });

    await prisma.notification.create({
      data: {
        userId:  order.clientId,
        orderId: order.id,
        title:   "Bank Transfer — Additional Chapters Pending",
        message: `You requested Chapter(s) ${chaptersRequested.join(", ")} for "${order.topic}" via bank transfer. Reference: ${reference}. We'll confirm once payment is received.`,
        type:    "INFO",
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(a => ({
          userId:  a.id,
          orderId: order.id,
          title:   "🏦 Add Chapters — Bank Transfer Pending",
          message: `"${order.topic}" — Ch ${chaptersRequested.join(", ")}. Ref: ${reference}. Amount: ₦${(amountKobo/100).toLocaleString()}. Confirm in Bank Transfers tab.`,
          type:    "ACTION_REQUIRED" as const,
        })),
      });
    }

    // Email the dedicated payments inbox so confirmations happen promptly
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY!);
      await resend.emails.send({
        from: "iProjectMaster <noreply@hire.iprojectmaster.com>",
        to:   "payment.iprojectmaster@gmail.com",
        subject: `🏦 New Bank Transfer (Add Chapters) — ₦${(amountKobo/100).toLocaleString()} (Ref: ${reference})`,
        html: `
          <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:1.5rem;background:#fff;border-radius:14px;border:1px solid #BAE6FD;">
            <h2 style="color:#0C1A2E;font-size:1.1rem;margin:0 0 .75rem;">🏦 Add-Chapter Bank Transfer</h2>
            <table style="width:100%;font-size:.85rem;color:#0C1A2E;border-collapse:collapse;">
              <tr><td style="padding:.4rem 0;color:#5B7EA6;">Topic</td><td style="padding:.4rem 0;font-weight:700;">${order.topic}</td></tr>
              <tr><td style="padding:.4rem 0;color:#5B7EA6;">Chapter(s)</td><td style="padding:.4rem 0;font-weight:700;">${chaptersRequested.join(", ")}</td></tr>
              <tr><td style="padding:.4rem 0;color:#5B7EA6;">Amount</td><td style="padding:.4rem 0;font-weight:700;">₦${(amountKobo/100).toLocaleString()}</td></tr>
              <tr><td style="padding:.4rem 0;color:#5B7EA6;">Reference</td><td style="padding:.4rem 0;font-weight:700;font-family:monospace;">${reference}</td></tr>
            </table>
            <p style="color:#5B7EA6;font-size:.8rem;line-height:1.6;margin-top:1rem;">Once payment is confirmed, log in and confirm under Admin → Bank Transfers → Add-Chapter Requests to auto-assign.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/bank-transfers" style="display:inline-block;margin-top:.75rem;padding:.7rem 1.5rem;background:#38BDF8;color:#0C1A2E;font-weight:700;font-size:.85rem;border-radius:10px;text-decoration:none;">Go to Bank Transfers →</a>
          </div>
        `,
      });
    } catch (e) { console.error("[EMAIL] Add-chapters bank transfer admin notify:", e); }

    return NextResponse.json({
      success:     true,
      bankTransfer:true,
      reference,
      amountNaira: amountKobo / 100,
    });
  }

  // ── Paystack flow (default) ──────────────────────────────────
  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email:    session.user.email,
      amount:   amountKobo,
      currency: "NGN",
      metadata: {
        orderId,
        addChapters:   chaptersRequested,
        isAddChapters: true,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/inprogress`,
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackData.status) {
    return NextResponse.json({ error: "Payment initialization failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    success:    true,
    paymentUrl: paystackData.data.authorization_url,
    amountNaira: amountKobo / 100,
  });
}
