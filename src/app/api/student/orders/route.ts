export const dynamic = "force-dynamic";
// src/app/api/student/orders/route.ts
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
  const filter = searchParams.get("filter") || "all";

  // Build where clause based on filter
  let where: any = { clientId: session.user.id };

  if (filter === "active") {
    where.status = { in: [OrderStatus.IN_PROGRESS, OrderStatus.QC_REVIEW, OrderStatus.PAYMENT_CONFIRMED] };
  } else if (filter === "completed") {
    // Orders with at least one delivered chapter OR fully delivered order
    where.OR = [
      { status: OrderStatus.DELIVERED },
      { chapters: { some: { status: "DELIVERED" } } },
    ];
  } else if (filter === "revision") {
    where.status = OrderStatus.REVISION_REQUESTED;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      plan: { select: { planName: true, degreeGroup: true, pricingType: true } },
      chapters: {
        select: {
          id: true, chapterNumber: true, chapterLabel: true,
          status: true, deliveredFileUrl: true, deliveredAt: true,
        },
        orderBy: { chapterNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted = orders.map(o => ({
    id:               o.id,
    topic:            o.topic,
    department:       o.department,
    degreeGroup:      o.degreeGroup,
    status:           o.status,
    planName:         o.plan.planName,
    paidAt:           o.paidAt,
    createdAt:        o.createdAt,
    chapters:         o.chapters.map(ch => ({
      id:               ch.id,
      chapterNumber:    ch.chapterNumber,
      chapterLabel:     ch.chapterLabel,
      status:           ch.status,
      deliveredFileUrl: ch.deliveredFileUrl,
      deliveredAt:      ch.deliveredAt,
    })),
    totalChapters:     o.chapters.length,
    deliveredChapters: o.chapters.filter(ch => ch.status === "DELIVERED").length,
  }));

  return NextResponse.json({ success: true, data: formatted });
}
