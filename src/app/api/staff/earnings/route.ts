export const dynamic = "force-dynamic";
// src/app/api/staff/earnings/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const STAFF_ROLES = [Role.WRITER, Role.ANALYST, Role.QC, Role.SUB_ADMIN, Role.MAIN_ADMIN];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !STAFF_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const earnings = await prisma.earning.findMany({
    where:   { userId: session.user.id },
    include: {
      orderChapter: {
        select: {
          chapterLabel: true,
          chapterNumber: true,
          status:        true,
          order: {
            select: {
              topic:       true,
              degreeGroup: true,
              serviceType: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending   = earnings.filter(e => e.status === "PENDING");
  const available = earnings.filter(e => e.status === "AVAILABLE");
  const withdrawn = earnings.filter(e => e.status === "WITHDRAWN");

  const summary = {
    pendingKobo:   pending.reduce((s, e)   => s + e.amountKobo, 0),
    availableKobo: available.reduce((s, e) => s + e.amountKobo, 0),
    withdrawnKobo: withdrawn.reduce((s, e) => s + e.amountKobo, 0),
    totalKobo:     earnings.reduce((s, e)  => s + e.amountKobo, 0),
  };

  return NextResponse.json({
    success: true,
    data: {
      earnings: earnings.map(e => ({
        id:           e.id,
        amountKobo:   e.amountKobo,
        status:       e.status,
        availableAt:  e.availableAt,
        createdAt:    e.createdAt,
        chapterLabel: e.orderChapter.chapterLabel,
        topic:        e.orderChapter.order.topic,
        degreeGroup:  e.orderChapter.order.degreeGroup,
        serviceType:  e.orderChapter.order.serviceType,
        chapterStatus:e.orderChapter.status,
      })),
      summary,
    },
  });
}
