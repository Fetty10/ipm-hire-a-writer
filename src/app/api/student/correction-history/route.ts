export const dynamic = "force-dynamic";
// src/app/api/student/correction-history/route.ts
// Returns resolved correction history for a chapter — before/after files,
// what was requested, and when — so students can see exactly what changed.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get("chapterId");
  if (!chapterId) return NextResponse.json({ error: "chapterId required" }, { status: 400 });

  // Verify the chapter belongs to this student (or staff can view any)
  const chapter = await prisma.orderChapter.findUnique({
    where:  { id: chapterId },
    select: { order: { select: { clientId: true } } },
  });
  if (!chapter) return NextResponse.json({ error: "Chapter not found." }, { status: 404 });

  const isOwner = chapter.order.clientId === session.user.id;
  const isStaff = [Role.WRITER, Role.ANALYST, Role.QC, Role.SUB_ADMIN, Role.MAIN_ADMIN].includes(session.user.role);
  if (!isOwner && !isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const history = await (prisma as any).correctionHistory.findMany({
    where:   { orderChapterId: chapterId },
    orderBy: { resolvedAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: history.map((h: any) => ({
      id:             h.id,
      studentRequest: h.studentRequest,
      qcInstructions: h.qcInstructions,
      fileBeforeUrl:  h.fileBeforeUrl,
      fileAfterUrl:   h.fileAfterUrl,
      requestedAt:    h.requestedAt,
      resolvedAt:     h.resolvedAt,
    })),
  });
}
