export const dynamic = "force-dynamic";
// src/app/api/integrations/lina/abandoned-payments/route.ts
//
// Dedicated endpoint for Lina (WhatsApp bot) to follow up with students
// who started checkout but never completed payment.
//
// Auth: requires header `Authorization: Bearer <LINA_API_KEY>`
// (set LINA_API_KEY in Vercel env vars, and give Lina the same value)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.LINA_API_KEY}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  // Only return orders abandoned for at least this many minutes (default 30)
  const minMinutesAgo = parseInt(searchParams.get("minMinutesAgo") || "30");
  const cutoff = new Date(Date.now() - minMinutesAgo * 60 * 1000);

  // Don't re-surface orders Lina already followed up on within the last
  // 24 hours, so she's not pinging the same student every time she polls
  const followUpCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // ── 1. Abandoned new orders (project + other services) ──────────
  const abandonedOrders = await prisma.order.findMany({
    where: {
      status:    "PENDING_PAYMENT",
      createdAt: { lte: cutoff },
      // Exclude bank transfer — those are intentionally pending admin
      // confirmation, not "abandoned" in the follow-up sense
      paymentMethod: { not: "BANK_TRANSFER" },
      OR: [
        { linaFollowedUpAt: null },
        { linaFollowedUpAt: { lte: followUpCutoff } },
      ],
    } as any,
    select: {
      id: true,
      topic: true,
      department: true,
      degreeGroup: true,
      serviceType: true,
      createdAt: true,
      client: { select: { name: true, phone: true, email: true } },
      plan:   { select: { planName: true, priceKobo: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // ── 2. Abandoned add-chapter requests (Paystack only — bank
  // transfer ones are intentionally pending confirmation) ──────────
  const abandonedChapterRequests = await (prisma as any).pendingChapterRequest.findMany({
    where: {
      status:    "PENDING_PAYMENT",
      createdAt: { lte: cutoff },
      OR: [
        { linaFollowedUpAt: null },
        { linaFollowedUpAt: { lte: followUpCutoff } },
      ],
    },
    select: {
      id: true,
      orderId: true,
      chapterNumbers: true,
      amountKobo: true,
      reference: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Enrich chapter requests with student + topic info
  const chapterReqOrderIds = abandonedChapterRequests.map((r: any) => r.orderId);
  const relatedOrders = chapterReqOrderIds.length > 0
    ? await prisma.order.findMany({
        where:  { id: { in: chapterReqOrderIds } },
        select: { id: true, topic: true, client: { select: { name: true, phone: true, email: true } } },
      })
    : [];
  const orderMap = Object.fromEntries(relatedOrders.map(o => [o.id, o]));

  return NextResponse.json({
    success: true,
    data: {
      abandonedOrders: abandonedOrders.map(o => ({
        orderId:      o.id,
        topic:        o.topic,
        department:   o.department,
        degreeGroup:  o.degreeGroup,
        serviceType:  o.serviceType,
        planName:     o.plan?.planName || null,
        amountNaira:  (o.plan?.priceKobo || 0) / 100,
        minutesAgo:   Math.round((Date.now() - o.createdAt.getTime()) / 60000),
        client: {
          name:  o.client.name,
          phone: o.client.phone,
          email: o.client.email,
        },
      })),
      abandonedAddChapterRequests: abandonedChapterRequests.map((r: any) => ({
        requestId:      r.id,
        orderId:        r.orderId,
        topic:          orderMap[r.orderId]?.topic || null,
        chapterNumbers: r.chapterNumbers,
        amountNaira:    r.amountKobo / 100,
        reference:      r.reference,
        minutesAgo:     Math.round((Date.now() - new Date(r.createdAt).getTime()) / 60000),
        client: orderMap[r.orderId]?.client ? {
          name:  orderMap[r.orderId].client.name,
          phone: orderMap[r.orderId].client.phone,
          email: orderMap[r.orderId].client.email,
        } : null,
      })),
      totalAbandoned: abandonedOrders.length + abandonedChapterRequests.length,
    },
  });
}

// ── POST — Lina calls this after sending a follow-up message, so the
// same order/request doesn't get re-surfaced for 24 hours ───────────
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, requestId } = await req.json();

  if (!orderId && !requestId) {
    return NextResponse.json({ error: "orderId or requestId is required." }, { status: 400 });
  }

  if (orderId) {
    await prisma.order.update({
      where: { id: orderId },
      data:  { linaFollowedUpAt: new Date() } as any,
    });
  }

  if (requestId) {
    await (prisma as any).pendingChapterRequest.update({
      where: { id: requestId },
      data:  { linaFollowedUpAt: new Date() },
    });
  }

  return NextResponse.json({ success: true, message: "Marked as followed up." });
}
