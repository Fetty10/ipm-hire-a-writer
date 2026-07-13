export const dynamic = "force-dynamic";
// src/app/api/chapters/resubmit/route.ts
// Allows a writer/analyst to override their submitted file before QC clears it

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role as Role;
  if (![Role.WRITER, Role.ANALYST, Role.QC].includes(role)) {
    return NextResponse.json({ error: "Only writers, analysts and QC can resubmit." }, { status: 403 });
  }

  const { chapterId, fileUrl } = await req.json();
  if (!chapterId || !fileUrl) {
    return NextResponse.json({ error: "chapterId and fileUrl are required." }, { status: 400 });
  }

  // Find the chapter and verify it belongs to this staff member
  const chapter = await prisma.orderChapter.findUnique({
    where:  { id: chapterId },
    select: { id:true, status:true, assignedToId:true, chapterLabel:true, order:{ select:{ topic:true } } },
  });

  if (!chapter) return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
  if (chapter.assignedToId !== session.user.id) {
    return NextResponse.json({ error: "This chapter is not assigned to you." }, { status: 403 });
  }
  if (chapter.status === "QC_CLEARED") {
    return NextResponse.json({ error: "This chapter has already been QC cleared and cannot be resubmitted." }, { status: 400 });
  }

  // Update both submittedFileUrl and deliveredFileUrl so the new file is served everywhere
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data:  { submittedFileUrl: fileUrl, deliveredFileUrl: fileUrl } as any,
  });

  // Notify admin
  const admins = await prisma.user.findMany({
    where:  { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
    select: { id:true },
  });
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId:  a.id,
        title:   "↩ Chapter Resubmitted",
        message: `${chapter.chapterLabel} for "${chapter.order.topic}" has been resubmitted by the writer with a corrected file.`,
        type:    "INFO" as const,
      })),
    });
  }

  return NextResponse.json({ success: true, message: "Chapter resubmitted successfully." });
}
