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
  const availableChapters   = [1,2,3,4,5].filter(n => !existingChapterNums.includes(n));

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
      availableChapters,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, chaptersRequested, guidelineFileUrl } = await req.json();

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

  // Calculate amount
  const amountKobo = order.plan.pricingType === "PER_CHAPTER"
    ? order.plan.priceKobo * chaptersRequested.length
    : order.plan.priceKobo;

  // Update guideline if new one uploaded
  if (guidelineFileUrl) {
    const existing = order.guidelineFileUrl;
    await prisma.order.update({
      where: { id: orderId },
      data: { guidelineFileUrl: existing ? `${existing},${guidelineFileUrl}` : guidelineFileUrl },
    });
  }

  // Initialize Paystack payment
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
