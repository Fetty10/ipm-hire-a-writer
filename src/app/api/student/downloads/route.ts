// src/app/api/student/downloads/route.ts
// Returns all delivered chapters for the logged-in student

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chapters = await prisma.orderChapter.findMany({
    where: {
      status: ChapterStatus.DELIVERED,
      order:  { clientId: session.user.id },
    },
    include: {
      order: {
        select: {
          topic:       true,
          degreeGroup: true,
          plan: { select: { planName: true } },
        },
      },
    },
    orderBy: { deliveredAt: "desc" },
  });

  const downloads = chapters.map(ch => ({
    id:              ch.id,
    chapterLabel:    ch.chapterLabel,
    chapterNumber:   ch.chapterNumber,
    topic:           ch.order.topic,
    degreeGroup:     ch.order.degreeGroup,
    planName:        ch.order.plan.planName,
    fileUrl:         ch.deliveredFileUrl,
    deliveredAt:     ch.deliveredAt,
    isQcCleared:     !!ch.qcFileUrl,
    plagiarismScore: (ch as any).plagiarismScore ?? null,
    aiScore:         (ch as any).aiScore ?? null,
  }));

  return NextResponse.json({ success: true, data: downloads });
}
