export const dynamic = "force-dynamic";
// src/app/api/integrations/lina/abandoned-payments/route.ts
//
// Dedicated endpoint for Lina (WhatsApp bot) to follow up with students
// who started checkout but never completed payment.
//
// Reminder schedule:
//   - 1st reminder: sent once the order has been pending for >= 1 hour
//   - 2nd reminder: sent once the order has been pending for >= 24 hours
//   - No further reminders after the 2nd one
//
// Auth: requires header `Authorization: Bearer <LINA_API_KEY>`
// (set LINA_API_KEY in Vercel env vars, and give Lina the same value)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ONE_HOUR_MS   = 60 * 60 * 1000;
const ONE_DAY_MS     = 24 * ONE_HOUR_MS;

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.LINA_API_KEY}`;
}

// Determine which reminder (if any) is due right now, based on how long
// ago the order was created and how many reminders have already been sent.
function getDueStage(createdAt: Date, followUpCount: number): "1_HOUR" | "24_HOUR" | null {
  const ageMs = Date.now() - createdAt.getTime();

  if (followUpCount === 0 && ageMs >= ONE_HOUR_MS) {
    return "1_HOUR";
  }
  if (followUpCount === 1 && ageMs >= ONE_DAY_MS) {
    return "24_HOUR";
  }
  return null; // either too early, or both reminders already sent
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pull every still-pending order/request that hasn't exhausted its
  // reminder schedule yet (followUpCount < 2), then filter in code by
  // exact stage timing — simpler and clearer than complex SQL date math.
  const candidateOrders = await prisma.order.findMany({
    where: {
      status:           "PENDING_PAYMENT",
      paymentMethod:    { not: "BANK_TRANSFER" }, // bank transfer = intentionally pending admin confirmation
      linaFollowUpCount: { lt: 2 },
    } as any,
    select: {
      id: true,
      topic: true,
      department: true,
      degreeGroup: true,
      serviceType: true,
      createdAt: true,
      linaFollowUpCount: true,
      client: { select: { name: true, phone: true, email: true } },
      plan:   { select: { planName: true, priceKobo: true } },
    } as any,
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const candidateRequests = await (prisma as any).pendingChapterRequest.findMany({
    where: {
      status:            "PENDING_PAYMENT",
      linaFollowUpCount: { lt: 2 },
    },
    select: {
      id: true,
      orderId: true,
      chapterNumbers: true,
      amountKobo: true,
      reference: true,
      createdAt: true,
      linaFollowUpCount: true,
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  // Filter down to only those whose reminder is actually due right now
  const dueOrders = (candidateOrders as any[])
    .map(o => ({ ...o, stage: getDueStage(o.createdAt, o.linaFollowUpCount) }))
    .filter(o => o.stage !== null);

  const dueRequests = (candidateRequests as any[])
    .map(r => ({ ...r, stage: getDueStage(new Date(r.createdAt), r.linaFollowUpCount) }))
    .filter(r => r.stage !== null);

  // Enrich chapter requests with student + topic info
  const chapterReqOrderIds = dueRequests.map(r => r.orderId);
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
      abandonedOrders: dueOrders.map(o => ({
        orderId:      o.id,
        topic:        o.topic,
        department:   o.department,
        degreeGroup:  o.degreeGroup,
        serviceType:  o.serviceType,
        planName:     o.plan?.planName || null,
        amountNaira:  (o.plan?.priceKobo || 0) / 100,
        minutesAgo:   Math.round((Date.now() - o.createdAt.getTime()) / 60000),
        reminderStage: o.stage, // "1_HOUR" | "24_HOUR"
        client: {
          name:  o.client.name,
          phone: o.client.phone,
          email: o.client.email,
        },
      })),
      abandonedAddChapterRequests: dueRequests.map(r => ({
        requestId:      r.id,
        orderId:        r.orderId,
        topic:          orderMap[r.orderId]?.topic || null,
        chapterNumbers: r.chapterNumbers,
        amountNaira:    r.amountKobo / 100,
        reference:      r.reference,
        minutesAgo:     Math.round((Date.now() - new Date(r.createdAt).getTime()) / 60000),
        reminderStage:  r.stage, // "1_HOUR" | "24_HOUR"
        client: orderMap[r.orderId]?.client ? {
          name:  orderMap[r.orderId].client.name,
          phone: orderMap[r.orderId].client.phone,
          email: orderMap[r.orderId].client.email,
        } : null,
      })),
      totalDue: dueOrders.length + dueRequests.length,
    },
  });
}

// ── POST — Lina calls this after sending a reminder, incrementing the
// follow-up count so the NEXT call only surfaces the next stage ─────
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
      data:  { linaFollowUpCount: { increment: 1 }, linaFollowedUpAt: new Date() } as any,
    });
  }

  if (requestId) {
    await (prisma as any).pendingChapterRequest.update({
      where: { id: requestId },
      data:  { linaFollowUpCount: { increment: 1 }, linaFollowedUpAt: new Date() },
    });
  }

  return NextResponse.json({ success: true, message: "Follow-up recorded." });
}
