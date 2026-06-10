export const dynamic = "force-dynamic";
// src/app/api/admin/overview/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, OrderStatus, ChapterStatus } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    activeOrders, totalOrders, qcReview,
    pendingApprovals, pendingWithdrawals,
    activeStaff, deliveredToday,
    revenueMonth
  ] = await Promise.all([
    prisma.order.count({ where: { status: { in: [OrderStatus.IN_PROGRESS, OrderStatus.QC_REVIEW] } } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: OrderStatus.QC_REVIEW } }),
    prisma.user.count({ where: { role: { in: [Role.WRITER, Role.ANALYST, Role.QC] }, isApproved: false } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: { in: [Role.WRITER, Role.ANALYST, Role.QC] }, isApproved: true, isSuspended: false } }),
    prisma.orderChapter.count({
      where: {
        status: ChapterStatus.DELIVERED,
        deliveredAt: { gte: new Date(new Date().setHours(0,0,0,0)) },
      },
    }),
    prisma.order.aggregate({
      where: {
        paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        status: { not: OrderStatus.CANCELLED },
      },
      _sum: { amountPaidKobo: true },
    }),
  ]);

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    take: 5, orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, phone: true } },
      plan:   { select: { planName: true } },
    },
  });

  // Pending approvals detail
  const pendingStaff = await prisma.user.findMany({
    where: { role: { in: [Role.WRITER, Role.ANALYST, Role.QC] }, isApproved: false },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Pending withdrawals detail
  const pendingWds = await prisma.withdrawal.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { name: true, role: true } } },
    orderBy: { requestedAt: "desc" },
    take: 5,
  });

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        activeOrders, totalOrders, qcReview, pendingApprovals,
        pendingWithdrawals, activeStaff, deliveredToday,
        revenueMonth: (revenueMonth._sum.amountPaidKobo || 0) / 100,
      },
      recentOrders: recentOrders.map(o => ({
        id: o.id, topic: o.topic, status: o.status,
        degreeGroup: o.degreeGroup, planName: o.plan.planName,
        amountPaid: (o.amountPaidKobo || 0) / 100,
        studentName: o.client.name, studentPhone: o.client.phone,
        createdAt: o.createdAt,
      })),
      pendingStaff, pendingWds: pendingWds.map(w => ({
        id: w.id, amountNaira: w.amountKobo / 100,
        bankName: w.bankName, accountNumber: w.accountNumber, accountName: w.accountName,
        staffName: w.user.name, staffRole: w.user.role, requestedAt: w.requestedAt,
      })),
    },
  });
}
