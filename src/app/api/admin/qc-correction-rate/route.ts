export const dynamic = "force-dynamic";
// src/app/api/admin/qc-correction-rate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await (prisma as any).qCCorrectionRate.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({ success: true, data: rate });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { monthlyRateKobo } = await req.json();
  if (monthlyRateKobo === undefined || monthlyRateKobo < 0) {
    return NextResponse.json({ error: "monthlyRateKobo is required." }, { status: 400 });
  }

  const rate = await (prisma as any).qCCorrectionRate.upsert({
    where:  { id: "singleton" },
    update: { monthlyRateKobo, updatedById: session.user.id, updatedAt: new Date() },
    create: { id: "singleton", monthlyRateKobo, updatedById: session.user.id },
  });

  return NextResponse.json({ success: true, data: rate, message: "Monthly correction rate updated." });
}
