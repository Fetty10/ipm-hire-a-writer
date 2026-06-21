export const dynamic = "force-dynamic";
// src/app/api/staff/correction-status/route.ts
// Returns whether the logged-in staff has pending escalated corrections,
// used to show a warning banner on the withdraw page

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chapters = await prisma.orderChapter.findMany({
    where:  { assignedToId: session.user.id, isEscalatedCorrection: true } as any,
    select: { id: true, chapterLabel: true, order: { select: { topic: true } } },
  });

  return NextResponse.json({
    success: true,
    hasPending: chapters.length > 0,
    chapters: chapters.map((c: any) => ({ id: c.id, chapterLabel: c.chapterLabel, topic: c.order.topic })),
  });
}
