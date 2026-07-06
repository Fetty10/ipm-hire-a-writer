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

  // Use raw query to include international price fields which may not be
  // in the Prisma-generated client if schema wasn't migrated with them
  const plans = await prisma.$queryRaw<any[]>`
    SELECT
      id, "planName", "degreeGroup", "pricingType",
      "priceKobo"::integer AS "priceKobo",
      "priceGHS"::integer AS "priceGHS",
      "priceKES"::integer AS "priceKES",
      "priceUSD"::integer AS "priceUSD",
      "priceGBP"::integer AS "priceGBP",
      "includesCorrections", "includesFormat", "includesPlagiarismCheck"
    FROM "Plan"
    WHERE "degreeGroup" = ${degreeGroup}::"DegreeGroup"
      AND "isActive" = true
    ORDER BY "planName" ASC
  `;

  const data = plans.map(p => ({
    id:                      p.id,
    planName:                p.planName,
    degreeGroup:             p.degreeGroup,
    pricingType:             p.pricingType,
    priceKobo:               p.priceKobo,
    priceGHS:                p.priceGHS ?? null,
    priceKES:                p.priceKES ?? null,
    priceUSD:                p.priceUSD ?? null,
    priceGBP:                p.priceGBP ?? null,
    includesCorrections:     p.includesCorrections,
    includesFormat:          p.includesFormat,
    includesPlagiarismCheck: p.includesPlagiarismCheck,
  }));

  return NextResponse.json({ success: true, data });
}
