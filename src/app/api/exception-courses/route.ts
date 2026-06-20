export const dynamic = "force-dynamic";
// src/app/api/exception-courses/route.ts
// Public endpoint — returns just course names so the hire form can filter plans

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const departments = await prisma.exceptionDepartment.findMany({
    select: { name: true },
  });

  return NextResponse.json({
    success: true,
    data: departments.map(d => d.name),
  });
}
