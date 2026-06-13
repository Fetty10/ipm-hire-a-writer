// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status  = searchParams.get("status") as OrderStatus | "all" | null;
  const search  = searchParams.get("search") || "";
  const page    = parseInt(searchParams.get("page") || "1");
  const perPage = 20;

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { topic:              { contains: search, mode: "insensitive" } },
      { client: { name:    { contains: search, mode: "insensitive" } } },
      { client: { phone:   { contains: search, mode: "insensitive" } } },
      { client: { email:   { contains: search, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip: (page - 1) * perPage, take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        plan:   { select: { planName: true, degreeGroup: true } },
        chapters: {
          select: {
            id: true, chapterLabel: true, chapterNumber: true, status: true,
            assignedToId: true, assigneeRole: true,
            assignedTo: { select: { id: true, name: true, role: true } },
          },
          orderBy: { chapterNumber: "asc" },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      orders: orders.map(o => ({
        id: o.id, topic: o.topic, department: o.department,
        degreeGroup: o.degreeGroup, status: o.status,
        planName: o.plan.planName, amountPaid: (o.amountPaidKobo || 0) / 100,
        amountPaidKobo: o.amountPaidKobo || 0,
        requiresPlagiarismCheck: o.requiresPlagiarismCheck,
        requiresAiCheck: o.requiresAiCheck,
        student: o.client,
        client:  o.client,
        chapters: o.chapters,
        createdAt: o.createdAt, paidAt: o.paidAt,
        paymentMethod:         (o as any).paymentMethod || "PAYSTACK",
        bankTransferReference: (o as any).bankTransferReference || null,
        adminNote:             o.adminNote || null,
      })),
      total, page, pages: Math.ceil(total / perPage),
    },
  });
}
