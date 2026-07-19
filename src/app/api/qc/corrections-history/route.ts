export const dynamic = "force-dynamic";
// src/app/api/qc/corrections-history/route.ts
// Returns completed corrections for the logged-in QC staff member

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page   = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const limit  = 15;
  const skip   = (page - 1) * limit;

  const where: any = {
    resolvedById: session.user.id,
    ...(search ? { chapter: { order: { topic: { contains: search, mode: "insensitive" } } } } : {}),
  };

  const [records, total] = await Promise.all([
    (prisma as any).correctionHistory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { resolvedAt: "desc" },
      include: {
        chapter: {
          select: {
            id:           true,
            chapterLabel: true,
            status:       true,
            order: {
              select: {
                topic:       true,
                department:  true,
                degreeGroup: true,
              },
            },
          },
        },
      },
    }),
    (prisma as any).correctionHistory.count({ where }),
  ]);

  const data = records.map((r: any) => ({
    id:             r.id,
    chapterId:      r.orderChapterId,
    chapterLabel:   r.chapter?.chapterLabel,
    topic:          r.chapter?.order?.topic,
    department:     r.chapter?.order?.department,
    degreeGroup:    r.chapter?.order?.degreeGroup,
    studentRequest: r.studentRequest,
    qcInstructions: r.qcInstructions,
    fileBeforeUrl:  r.fileBeforeUrl,
    fileAfterUrl:   r.fileAfterUrl,
    requestedAt:    r.requestedAt,
    resolvedAt:     r.resolvedAt,
  }));

  return NextResponse.json({ success: true, data, total, pages: Math.ceil(total / limit) });
}
