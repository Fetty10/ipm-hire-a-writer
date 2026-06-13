export const dynamic = "force-dynamic";
// TEMPORARY — src/app/api/debug/staff-jobs/route.ts
// Shows job counts per staff member for debugging assignment
// DELETE after debugging

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roles = [Role.WRITER, Role.ANALYST, Role.QC];

  const result: any = {};

  for (const role of roles) {
    const staffList = await prisma.user.findMany({
      where: { role, isApproved: true, isSuspended: false },
      select: { id: true, name: true, email: true },
    });

    result[role] = await Promise.all(staffList.map(async (staff) => {
      const byStatus = await prisma.orderChapter.groupBy({
        by: ["status"],
        where: { assignedToId: staff.id },
        _count: { id: true },
      });

      const activeCount = await prisma.orderChapter.count({
        where: {
          assignedToId: staff.id,
          status: { notIn: ["DELIVERED", "QC_DONE"] as any[] },
        },
      });

      return {
        name:        staff.name,
        email:       staff.email,
        activeCount,
        byStatus:    Object.fromEntries(byStatus.map(s => [s.status, s._count.id])),
      };
    }));
  }

  return NextResponse.json(result);
}
