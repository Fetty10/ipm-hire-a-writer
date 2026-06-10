export const dynamic = "force-dynamic";
// src/app/api/qc/start/route.ts
// QC clicks "Start Check" — marks chapter QC_IN_PROGRESS

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.QC) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chapterId } = await req.json();
  if (!chapterId) {
    return NextResponse.json({ error: "chapterId is required." }, { status: 400 });
  }

  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:           chapterId,
      routedToQcId: session.user.id,
      status:       ChapterStatus.NOT_STARTED,
    },
    include: { order: { select: { topic: true } } },
  });

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapter not found or already started." },
      { status: 404 }
    );
  }

  await prisma.orderChapter.update({
    where: { id: chapterId },
    data:  { status: ChapterStatus.QC_IN_PROGRESS },
  });

  return NextResponse.json({ success: true, message: "QC check started." });
}
