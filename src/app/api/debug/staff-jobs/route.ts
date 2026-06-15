export const dynamic = "force-dynamic";
// TEMP: src/app/api/debug/staff-jobs/route.ts — delete after debugging

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
      where: { role, isApproved: true, isSuspended: false },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    result[role] = await Promise.all(staffList.map(async (staff) => {
      const byStatus = await prisma.orderChapter.groupBy({
        by: ["status"],
        where: { assignedToId: staff.id },
        _count: { id: true },
      });

      // What the assignment engine sees
      const activeCount = await prisma.orderChapter.count({
        where: {
          assignedToId: staff.id,
          status: { in: [ChapterStatus.NOT_STARTED, ChapterStatus.IN_PROGRESS, ChapterStatus.PRELIM_SUBMITTED] },
        },
      });

      return {
        name:        staff.name,
        email:       staff.email,
        joinedAt:    staff.createdAt,
        activeCount, // what engine uses for distribution
        byStatus:    Object.fromEntries(byStatus.map(s => [s.status, s._count.id])),
      };
    }));
  }

  return NextResponse.json(result, { status: 200 });
}
