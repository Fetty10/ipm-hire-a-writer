export const dynamic = "force-dynamic";
// src/app/api/student/chapter-requests/route.ts
// Returns the logged-in student's pending/confirmed add-chapter requests

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all orders belonging to this student
  const orders = await prisma.order.findMany({
    where:  { clientId: session.user.id },
    select: { id: true },
  });
  const orderIds = orders.map(o => o.id);

  if (orderIds.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  const requests = await (prisma as any).pendingChapterRequest.findMany({
    where:   { orderId: { in: orderIds } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: requests.map((r: any) => ({
      id:             r.id,
      orderId:        r.orderId,
      chapterNumbers: r.chapterNumbers,
      amountKobo:     r.amountKobo,
      reference:      r.reference,
      status:         r.status,
      createdAt:      r.createdAt,
      confirmedAt:    r.confirmedAt,
    })),
  });
}
