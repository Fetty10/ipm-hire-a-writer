export const dynamic = "force-dynamic";
// TEMP: src/app/api/debug/qc-chapter/route.ts — delete after debugging

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find all chapters currently in QC_IN_PROGRESS
  const chapters = await prisma.orderChapter.findMany({
    where: { status: "QC_IN_PROGRESS" },
    select: {
      id: true,
      chapterLabel: true,
      status: true,
      routedToQcId: true,
      routedToQcAt: true,
      startedAt: true,
      correctionNotes: true,
      order: { select: { topic: true, requiresPlagiarismCheck: true, requiresAiCheck: true, serviceType: true } },
    },
  });

  const qcStaff = await prisma.user.findMany({
    where: { role: "QC" },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ chapters, qcStaff });
}
