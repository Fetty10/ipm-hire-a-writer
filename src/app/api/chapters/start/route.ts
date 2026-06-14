export const dynamic = "force-dynamic";
// src/app/api/chapters/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";
import { getStaffDeadline } from "@/lib/workingDays";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.WRITER, Role.ANALYST].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chapterId } = await req.json();
  if (!chapterId) return NextResponse.json({ error: "chapterId is required." }, { status: 400 });

  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:           chapterId,
      assignedToId: session.user.id,
      status:       ChapterStatus.NOT_STARTED,
    },
    include: {
      order: {
        select: { topic: true, plan: { select: { planName: true } } },
      },
    },
  });

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found or not available to start." }, { status: 404 });
  }

  const now        = new Date();
  const planName   = chapter.order.plan.planName;
  const role       = session.user.role as "WRITER" | "ANALYST";
  const deadlineAt = getStaffDeadline(now, role, planName);

  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:    ChapterStatus.IN_PROGRESS,
      startedAt: now,
      deadlineAt,
    } as any,
  });

  return NextResponse.json({
    success:    true,
    message:    "Job started.",
    startedAt:  now.toISOString(),
    deadlineAt: deadlineAt.toISOString(),
  });
}
