export const dynamic = "force-dynamic";
// src/app/api/admin/activity/route.ts
// Returns session logs and activity logs for sub-admins

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.MAIN_ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const adminId = searchParams.get("adminId");
  const month   = searchParams.get("month"); // YYYY-MM
  const view    = searchParams.get("view") || "sessions"; // sessions | activity | summary

  // Get all sub-admins
  const admins = await prisma.user.findMany({
    where:  { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
    select: { id:true, name:true, email:true, role:true },
    orderBy:{ name:"asc" },
  });

  const userFilter = adminId ? `AND "userId" = '${adminId}'` : "";
  const monthFilter = month
    ? `AND "createdAt" >= '${month}-01' AND "createdAt" < '${month}-01'::date + INTERVAL '1 month'`
    : "AND \"createdAt\" >= NOW() - INTERVAL '30 days'";

  if (view === "sessions") {
    const sessions = await prisma.$queryRawUnsafe<any[]>(`
      SELECT s.id, s."userId", s.event, s."ipAddress", s."userAgent", s."createdAt",
             u.name, u.role
      FROM "SessionLog" s
      JOIN "User" u ON u.id = s."userId"
      WHERE 1=1 ${userFilter} ${monthFilter}
      ORDER BY s."createdAt" DESC
      LIMIT 200
    `);
    return NextResponse.json({ success: true, data: { admins, sessions } });
  }

  if (view === "activity") {
    const activities = await prisma.$queryRawUnsafe<any[]>(`
      SELECT a.id, a."userId", a.action, a.entity, a."entityId", a.detail,
             a."amountKobo", a."ipAddress", a."createdAt",
             u.name, u.role
      FROM "AdminActivityLog" a
      JOIN "User" u ON u.id = a."userId"
      WHERE 1=1 ${userFilter} ${monthFilter}
      ORDER BY a."createdAt" DESC
      LIMIT 200
    `);
    return NextResponse.json({ success: true, data: { admins, activities } });
  }

  // Summary view — per admin stats
  const summary = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      u.id, u.name, u.role,
      COUNT(DISTINCT s.id) FILTER (WHERE s.event = 'LOGIN') as login_count,
      COUNT(DISTINCT a.id) as total_actions,
      COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'CONFIRM_BANK_TRANSFER') as bank_transfers_confirmed,
      COALESCE(SUM(a."amountKobo") FILTER (WHERE a.action = 'CONFIRM_BANK_TRANSFER'), 0) as total_amount_confirmed,
      COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'LODGE_CORRECTION') as corrections_lodged,
      COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'APPROVE_STAFF') as staff_approved,
      COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'SUSPEND_STAFF') as staff_suspended,
      MAX(s."createdAt") FILTER (WHERE s.event = 'LOGIN') as last_login
    FROM "User" u
    LEFT JOIN "SessionLog" s ON s."userId" = u.id ${monthFilter.replace('AND "createdAt"', 'AND s."createdAt"')}
    LEFT JOIN "AdminActivityLog" a ON a."userId" = u.id ${monthFilter.replace('AND "createdAt"', 'AND a."createdAt"')}
    WHERE u.role IN ('MAIN_ADMIN', 'SUB_ADMIN')
    GROUP BY u.id, u.name, u.role
    ORDER BY u.name
  `);

  return NextResponse.json({ success: true, data: { admins, summary } });
}
