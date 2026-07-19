export const dynamic = "force-dynamic";
// src/app/api/qc/corrections-history/route.ts

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
  const offset = (page - 1) * limit;
  const userId = session.user.id;

  const searchFilter = search ? `AND o.topic ILIKE $3` : "";
  const params: any[] = search ? [userId, limit, `%${search}%`, offset] : [userId, limit, offset];
  // Adjust offset param index
  const offsetIdx = search ? 4 : 3;

  const records = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      ch.id,
      ch."orderChapterId",
      ch."studentRequest",
      ch."qcInstructions",
      ch."fileBeforeUrl",
      ch."fileAfterUrl",
      ch."requestedAt",
      ch."resolvedAt",
      oc."chapterLabel",
      o.topic,
      o.department,
      o."degreeGroup"
    FROM "CorrectionHistory" ch
    JOIN "OrderChapter" oc ON oc.id = ch."orderChapterId"
    JOIN "Order" o ON o.id = oc."orderId"
    WHERE ch."resolvedById" = $1
    ${searchFilter}
    ORDER BY ch."resolvedAt" DESC
    LIMIT $2 OFFSET $${offsetIdx}
  `, ...params);

  const countResult = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*) as total
    FROM "CorrectionHistory" ch
    JOIN "OrderChapter" oc ON oc.id = ch."orderChapterId"
    JOIN "Order" o ON o.id = oc."orderId"
    WHERE ch."resolvedById" = $1
    ${search ? `AND o.topic ILIKE $2` : ""}
  `, ...(search ? [userId, `%${search}%`] : [userId]));

  const total = Number(countResult[0]?.total || 0);

  const data = records.map(r => ({
    id:             r.id,
    chapterId:      r.orderChapterId,
    chapterLabel:   r.chapterLabel,
    topic:          r.topic,
    department:     r.department,
    degreeGroup:    r.degreeGroup,
    studentRequest: r.studentRequest,
    qcInstructions: r.qcInstructions,
    fileBeforeUrl:  r.fileBeforeUrl,
    fileAfterUrl:   r.fileAfterUrl,
    requestedAt:    r.requestedAt,
    resolvedAt:     r.resolvedAt,
  }));

  return NextResponse.json({ success: true, data, total, pages: Math.ceil(total / limit) });
}
