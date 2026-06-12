export const dynamic = "force-dynamic";
// src/app/api/orders/add-chapters/route.ts
// Student adds more chapters to an existing order
// Same plan, same topic — just new chapter selection + payment

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import Paystack from "paystack-api";

const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY!);

export async function GET(req: NextRequest) {
  // Returns existing order info + which chapters are already ordered
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
  const allChapters = [1, 2, 3, 4, 5];
  const availableChapters = allChapters.filter(n => !existingChapterNums.includes(n));

  return NextResponse.json({
    success: true,
    data: {
      orderId:           order.id,
      topic:             order.topic,
      department:        order.department,
      degreeGroup:       order.degreeGroup,
      planName:          order.plan.planName,
      pricePerChapter:   order.plan.priceKobo / 100,
      pricingType:       order.plan.pricingType,
      existingChapters:  existingChapterNums,
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
      client: { select: { email: true, name: true } },
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
    const combined = existing
      ? `${existing},${guidelineFileUrl}`
      : guidelineFileUrl;
    await prisma.order.update({
      where: { id: orderId },
      data: { guidelineFileUrl: combined },
    });
  }

  // Store pending chapters in metadata — will be created by webhook after payment
  const metadata = {
    orderId,
    addChapters: chaptersRequested,
    isAddChapters: true,
  };

  const paystackRes = await paystack.transaction.initialize({
    email:     order.client.email,
    amount:    amountKobo,
    metadata:  JSON.stringify(metadata),
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/inprogress`,
  });

  if (!paystackRes.status) {
    return NextResponse.json({ error: "Failed to initialize payment." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    paymentUrl: paystackRes.data.authorization_url,
    amountNaira: amountKobo / 100,
  });
}
