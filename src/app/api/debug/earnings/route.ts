export const dynamic = "force-dynamic";
// TEMPORARY — src/app/api/debug/earnings/route.ts
// DELETE after debugging

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const earnings = await prisma.earning.findMany({
    where: { userId: session.user.id },
    include: {
      orderChapter: {
        select: {
          chapterLabel: true,
          status: true,
          order: { select: { topic: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const summary = {
    total:     earnings.length,
    pending:   earnings.filter(e => e.status === "PENDING").length,
    available: earnings.filter(e => e.status === "AVAILABLE").length,
    withdrawn: earnings.filter(e => e.status === "WITHDRAWN").length,
    earnings,
  };

  return NextResponse.json(summary);
}
