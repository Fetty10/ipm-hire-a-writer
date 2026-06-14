export const dynamic = "force-dynamic";
// src/app/api/qc/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";
import { getStaffDeadline } from "@/lib/workingDays";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.QC) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chapterId } = await req.json();
  if (!chapterId) return NextResponse.json({ error: "chapterId is required." }, { status: 400 });

  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:     chapterId,
      status: ChapterStatus.QC_IN_PROGRESS,
      OR: [
        { routedToQcId: session.user.id },
        { routedToQcId: null },
      ],
    },
    include: {
      order: { select: { topic: true, plan: { select: { planName: true } } } },
    },
  });

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found or not available for QC." }, { status: 404 });
  }

  const now        = new Date();
  const planName   = chapter.order.plan.planName;
  const deadlineAt = getStaffDeadline(now, "QC", planName);

  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      routedToQcId: session.user.id,
      startedAt:    now,
      deadlineAt,
    } as any,
  });

  return NextResponse.json({
    success:    true,
    message:    "QC check started.",
    startedAt:  now.toISOString(),
    deadlineAt: deadlineAt.toISOString(),
  });
}
