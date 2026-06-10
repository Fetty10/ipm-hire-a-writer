export const dynamic = "force-dynamic";
// src/app/api/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DegreeGroup } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const degreeGroup = searchParams.get("degreeGroup") as DegreeGroup | null;

  const plans = await prisma.plan.findMany({
    where: {
      isActive: true,
      ...(degreeGroup ? { degreeGroup } : {}),
    },
    orderBy: { planName: "asc" },
    select: {
      id: true, planName: true, degreeGroup: true,
      pricingType: true, priceKobo: true,
      includesCorrections: true, includesFormat: true, includesPlagiarismCheck: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: plans.map(p => ({
      ...p,
      priceKobo: p.priceKobo,
      priceNaira: p.priceKobo / 100,
    })),
  });
}
