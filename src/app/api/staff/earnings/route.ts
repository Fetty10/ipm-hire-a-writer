export const dynamic = "force-dynamic";
// src/app/api/staff/earnings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const STAFF_ROLES = [Role.WRITER, Role.ANALYST, Role.QC, Role.SUB_ADMIN, Role.MAIN_ADMIN];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !STAFF_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page    = parseInt(searchParams.get("page") || "1");
  const perPage = 15;

  // Summary always covers ALL earnings, regardless of page
  const allEarnings = await prisma.earning.findMany({
    where:  { userId: session.user.id },
    select: { amountKobo: true, status: true },
  });

  const pending   = allEarnings.filter(e => e.status === "PENDING");
  const available = allEarnings.filter(e => e.status === "AVAILABLE");
  const withdrawn = allEarnings.filter(e => e.status === "WITHDRAWN");

  const summary = {
    pendingKobo:   pending.reduce((s, e)   => s + e.amountKobo, 0),
    availableKobo: available.reduce((s, e) => s + e.amountKobo, 0),
    withdrawnKobo: withdrawn.reduce((s, e) => s + e.amountKobo, 0),
    totalKobo:     allEarnings.reduce((s, e) => s + e.amountKobo, 0),
  };

  // Paginated list
  const [earnings, total] = await Promise.all([
    prisma.earning.findMany({
      where:   { userId: session.user.id },
      include: {
        orderChapter: {
          select: {
            chapterLabel: true,
            chapterNumber: true,
            status:        true,
            order: {
              select: { topic: true, degreeGroup: true, serviceType: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.earning.count({ where: { userId: session.user.id } }),
  ]);

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
      total, page, pages: Math.ceil(total / perPage),
    },
  });
}
