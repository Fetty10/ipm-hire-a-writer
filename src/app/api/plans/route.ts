export const dynamic = "force-dynamic";
// src/app/api/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const degreeGroup = searchParams.get("degreeGroup");

  if (!degreeGroup) {
    return NextResponse.json({ error: "degreeGroup required" }, { status: 400 });
  }

  const plans = await prisma.plan.findMany({
    where:   { degreeGroup: degreeGroup as any, isActive: true },
    orderBy: { planName: "asc" },
  });

  // Return with international prices
  const data = plans.map(p => ({
    id:                      p.id,
    planName:                p.planName,
    pricingType:             p.pricingType,
    priceKobo:               p.priceKobo,
    priceGHS:                (p as any).priceGHS || null,
    priceKES:                (p as any).priceKES || null,
    priceUSD:                (p as any).priceUSD || null,
    priceGBP:                (p as any).priceGBP || null,
    includesCorrections:     p.includesCorrections,
    includesFormat:          p.includesFormat,
    includesPlagiarismCheck: p.includesPlagiarismCheck,
  }));

  return NextResponse.json({ success: true, data });
}
