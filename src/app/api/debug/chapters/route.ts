export const dynamic = "force-dynamic";
// TEMPORARY DEBUG ROUTE — src/app/api/debug/chapters/route.ts
// DELETE after debugging

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const chapters = await prisma.orderChapter.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id:              true,
      chapterNumber:   true,
      status:          true,
      routedToQcId:    true,
      submittedAt:     true,
      submittedFileUrl:true,
      order: {
        select: {
          topic:  true,
          requiresPlagiarismCheck: true,
          requiresAiCheck: true,
          plan: { select: { planName: true } },
        },
      },
    },
  });
  return NextResponse.json({ chapters });
}
