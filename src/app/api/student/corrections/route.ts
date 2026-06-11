export const dynamic = "force-dynamic";
// src/app/api/student/corrections/route.ts
// Returns all correction requests made by the student with their status

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chapters = await prisma.orderChapter.findMany({
    where: {
      order: { clientId: session.user.id },
      correctionNotes: { not: null },
    },
    include: {
      order: {
        select: { topic: true, degreeGroup: true, plan: { select: { planName: true } } },
      },
    },
    orderBy: { routedToQcAt: "desc" },
  });

  const data = chapters.map(ch => ({
    id:              ch.id,
    chapterLabel:    ch.chapterLabel,
    chapterNumber:   ch.chapterNumber,
    topic:           ch.order.topic,
    degreeGroup:     ch.order.degreeGroup,
    planName:        ch.order.plan.planName,
    correctionNotes: ch.correctionNotes,
    status:          ch.status,
    routedToQcAt:    ch.routedToQcAt,
    deliveredFileUrl:ch.deliveredFileUrl,
    qcClearedAt:     ch.qcClearedAt,
  }));

  return NextResponse.json({ success: true, data });
}
