// src/app/api/student/orders/route.ts
// Returns orders for the logged-in student with full chapter status

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "all"; // all | active | completed | revision

  let statusFilter: OrderStatus[] | undefined;
  if (filter === "active")    statusFilter = [OrderStatus.IN_PROGRESS, OrderStatus.QC_REVIEW, OrderStatus.PAYMENT_CONFIRMED];
  if (filter === "completed") statusFilter = [OrderStatus.DELIVERED];
  if (filter === "revision")  statusFilter = [OrderStatus.REVISION_REQUESTED];

  const orders = await prisma.order.findMany({
    where: {
      clientId: session.user.id,
      status:   statusFilter ? { in: statusFilter } : undefined,
    },
    include: {
      plan: { select: { planName: true, degreeGroup: true, pricingType: true } },
      chapters: {
        select: {
          id: true, chapterNumber: true, chapterLabel: true,
          status: true, deliveredFileUrl: true, deliveredAt: true,
          requiresPlagiarismCheck: false,
        },
        orderBy: { chapterNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = orders.map(o => ({
    id:          o.id,
    topic:       o.topic,
    department:  o.department,
    degreeGroup: o.degreeGroup,
    status:      o.status,
    planName:    o.plan.planName,
    paidAt:      o.paidAt,
    createdAt:   o.createdAt,
    chapters:    o.chapters.map(ch => ({
      id:              ch.id,
      chapterNumber:   ch.chapterNumber,
      chapterLabel:    ch.chapterLabel,
      status:          ch.status,
      deliveredFileUrl: ch.deliveredFileUrl,
      deliveredAt:     ch.deliveredAt,
    })),
    // Counts
    totalChapters:     o.chapters.length,
    deliveredChapters: o.chapters.filter(ch => ch.status === "DELIVERED").length,
  }));

  return NextResponse.json({ success: true, data: formatted });
}
