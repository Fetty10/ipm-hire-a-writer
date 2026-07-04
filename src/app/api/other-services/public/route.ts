export const dynamic = "force-dynamic";
// src/app/api/other-services/public/route.ts
// Public endpoint — returns active other services for the register/hire form

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await (prisma as any).otherService.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ success: true, data: services });
}
