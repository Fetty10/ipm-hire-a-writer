export const dynamic = "force-dynamic";
// src/app/api/admin/activity/route.ts

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
  const adminId = searchParams.get("adminId") || null;
  const month   = searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const view    = searchParams.get("view") || "summary";

  // Get all admins
  const admins = await prisma.user.findMany({
    where:  { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
    select: { id:true, name:true, email:true, role:true },
    orderBy:{ name:"asc" },
  });

  const monthStart = `${month}-01`;
  const monthEnd   = `${month}-01`; // will add interval in SQL

  if (view === "sessions") {
    const sessions = adminId
      ? await prisma.$queryRawUnsafe<any[]>(`
          SELECT s.id, s."userId", s.event, s."ipAddress", s."userAgent", s."createdAt", u.name, u.role
          FROM "SessionLog" s JOIN "User" u ON u.id = s."userId"
          WHERE s."userId" = $1 AND s."createdAt" >= $2::date AND s."createdAt" < $2::date + INTERVAL '1 month'
          ORDER BY s."createdAt" DESC LIMIT 200
        `, adminId, monthStart)
      : await prisma.$queryRawUnsafe<any[]>(`
          SELECT s.id, s."userId", s.event, s."ipAddress", s."userAgent", s."createdAt", u.name, u.role
          FROM "SessionLog" s JOIN "User" u ON u.id = s."userId"
          WHERE s."createdAt" >= $1::date AND s."createdAt" < $1::date + INTERVAL '1 month'
          ORDER BY s."createdAt" DESC LIMIT 200
        `, monthStart);

    return NextResponse.json({ success: true, data: { admins, sessions } });
  }

  if (view === "activity") {
    const activities = adminId
      ? await prisma.$queryRawUnsafe<any[]>(`
          SELECT a.id, a."userId", a.action, a.entity, a."entityId", a.detail, a."amountKobo", a."ipAddress", a."createdAt", u.name, u.role
          FROM "AdminActivityLog" a JOIN "User" u ON u.id = a."userId"
          WHERE a."userId" = $1 AND a."createdAt" >= $2::date AND a."createdAt" < $2::date + INTERVAL '1 month'
          ORDER BY a."createdAt" DESC LIMIT 200
        `, adminId, monthStart)
      : await prisma.$queryRawUnsafe<any[]>(`
          SELECT a.id, a."userId", a.action, a.entity, a."entityId", a.detail, a."amountKobo", a."ipAddress", a."createdAt", u.name, u.role
          FROM "AdminActivityLog" a JOIN "User" u ON u.id = a."userId"
          WHERE a."createdAt" >= $1::date AND a."createdAt" < $1::date + INTERVAL '1 month'
          ORDER BY a."createdAt" DESC LIMIT 200
        `, monthStart);

    return NextResponse.json({ success: true, data: { admins, activities } });
  }

  // Summary view
  const summary = adminId
    ? await prisma.$queryRawUnsafe<any[]>(`
        SELECT u.id, u.name, u.role,
          COUNT(DISTINCT s.id) FILTER (WHERE s.event = 'LOGIN') as login_count,
          COUNT(DISTINCT a.id) as total_actions,
          COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'CONFIRM_BANK_TRANSFER') as bank_transfers_confirmed,
          COALESCE(SUM(a."amountKobo") FILTER (WHERE a.action = 'CONFIRM_BANK_TRANSFER'), 0) as total_amount_confirmed,
          COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'LODGE_CORRECTION') as corrections_lodged,
          COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'APPROVE_STAFF') as staff_approved,
          COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'SUSPEND_STAFF') as staff_suspended,
          MAX(s."createdAt") FILTER (WHERE s.event = 'LOGIN') as last_login
        FROM "User" u
        LEFT JOIN "SessionLog" s ON s."userId" = u.id AND s."createdAt" >= $2::date AND s."createdAt" < $2::date + INTERVAL '1 month'
        LEFT JOIN "AdminActivityLog" a ON a."userId" = u.id AND a."createdAt" >= $2::date AND a."createdAt" < $2::date + INTERVAL '1 month'
        WHERE u.id = $1
        GROUP BY u.id, u.name, u.role
      `, adminId, monthStart)
    : await prisma.$queryRawUnsafe<any[]>(`
        SELECT u.id, u.name, u.role,
          COUNT(DISTINCT s.id) FILTER (WHERE s.event = 'LOGIN') as login_count,
          COUNT(DISTINCT a.id) as total_actions,
          COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'CONFIRM_BANK_TRANSFER') as bank_transfers_confirmed,
          COALESCE(SUM(a."amountKobo") FILTER (WHERE a.action = 'CONFIRM_BANK_TRANSFER'), 0) as total_amount_confirmed,
          COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'LODGE_CORRECTION') as corrections_lodged,
          COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'APPROVE_STAFF') as staff_approved,
          COUNT(DISTINCT a.id) FILTER (WHERE a.action = 'SUSPEND_STAFF') as staff_suspended,
          MAX(s."createdAt") FILTER (WHERE s.event = 'LOGIN') as last_login
        FROM "User" u
        LEFT JOIN "SessionLog" s ON s."userId" = u.id AND s."createdAt" >= $1::date AND s."createdAt" < $1::date + INTERVAL '1 month'
        LEFT JOIN "AdminActivityLog" a ON a."userId" = u.id AND a."createdAt" >= $1::date AND a."createdAt" < $1::date + INTERVAL '1 month'
        WHERE u.role IN ('MAIN_ADMIN', 'SUB_ADMIN')
        GROUP BY u.id, u.name, u.role
        ORDER BY u.name
      `, monthStart);

  const summaryData = summary.map(r => ({
    ...r,
    login_count:             Number(r.login_count || 0),
    total_actions:           Number(r.total_actions || 0),
    bank_transfers_confirmed:Number(r.bank_transfers_confirmed || 0),
    total_amount_confirmed:  Number(r.total_amount_confirmed || 0),
    corrections_lodged:      Number(r.corrections_lodged || 0),
    staff_approved:          Number(r.staff_approved || 0),
    staff_suspended:         Number(r.staff_suspended || 0),
  }));

  return NextResponse.json({ success: true, data: { admins, summary: summaryData } });
}
