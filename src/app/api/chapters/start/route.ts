export const dynamic = "force-dynamic";
// src/app/api/chapters/start/route.ts
// Called when a writer/analyst/QC clicks "Start Job"
// Marks chapter as IN_PROGRESS and notifies admin

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (![Role.WRITER, Role.ANALYST, Role.QC].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { chapterId } = await req.json();
  if (!chapterId) {
    return NextResponse.json({ error: "chapterId is required." }, { status: 400 });
  }

  // Verify this chapter belongs to the logged-in staff member
  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:           chapterId,
      assignedToId: session.user.id,
      status:       ChapterStatus.NOT_STARTED,
    },
    include: { order: { select: { topic: true, clientId: true } } },
  });

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapter not found or already started." },
      { status: 404 }
    );
  }

  // Mark as in progress
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data:  { status: ChapterStatus.IN_PROGRESS },
  });

  // Notify student that work has begun
  await prisma.notification.create({
    data: {
      userId:  chapter.order.clientId,
      orderId: chapter.orderId,
      title:   `${chapter.chapterLabel} Started`,
      message: `Our expert has started working on your ${chapter.chapterLabel} for "${chapter.order.topic}".`,
      type:    "INFO",
    },
  });

  return NextResponse.json({ success: true, message: "Job started." });
}
