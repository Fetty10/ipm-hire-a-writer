// src/app/api/qc/start/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AssigneeRole, ChapterStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.QC) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chapterId } = await req.json();
  if (!chapterId) {
    return NextResponse.json({ error: "chapterId is required." }, { status: 400 });
  }

  // Allow starting chapters routed to this QC OR unassigned QC chapters
  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:     chapterId,
      status: ChapterStatus.QC_IN_PROGRESS,
      OR: [
        { routedToQcId: session.user.id },
        { routedToQcId: null },
      ],
    },
    include: { order: { select: { topic: true } } },
  });

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapter not found or not available for QC." },
      { status: 404 }
    );
  }

  // Assign to this QC if not already assigned
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:       ChapterStatus.QC_IN_PROGRESS,
      routedToQcId: session.user.id,
      assigneeRole: AssigneeRole.QC,
      routedToQcAt: chapter.routedToQcAt || new Date(),
    },
  });

  return NextResponse.json({ success: true, message: "QC check started." });
}
