export const dynamic = "force-dynamic";
// TEMP: src/app/api/debug/staff-jobs/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, ChapterStatus } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = [Role.WRITER, Role.ANALYST, Role.QC];
  const result: any = {};

  for (const role of roles) {
    const staffList = await prisma.user.findMany({
      where:   { role, isApproved: true, isSuspended: false },
      select:  { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    result[role] = await Promise.all(staffList.map(async (staff) => {
      const byStatus = await prisma.orderChapter.groupBy({
        by:    ["status"],
        where: { assignedToId: staff.id },
        _count: { id: true },
      });

      // Writer/Analyst: what engine NOW counts
      const engineCount = role !== Role.QC
        ? await prisma.orderChapter.count({
            where: {
              assignedToId: staff.id,
              status: { in: [
                ChapterStatus.NOT_STARTED,
                ChapterStatus.IN_PROGRESS,
                ChapterStatus.PRELIM_SUBMITTED,
                ChapterStatus.SUBMITTED,
                ChapterStatus.QC_IN_PROGRESS,
              ]},
            },
          })
        // QC: count by routedToQcId
        : await prisma.orderChapter.count({
            where: { routedToQcId: staff.id, status: ChapterStatus.QC_IN_PROGRESS },
          });

      return {
        name:        staff.name,
        engineCount, // what assignment engine uses
        byStatus:    Object.fromEntries(byStatus.map(s => [s.status, s._count.id])),
      };
    }));
  }

  return NextResponse.json(result);
}
