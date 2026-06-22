export const dynamic = "force-dynamic";
// TEMP: src/app/api/debug/repair-orphaned-qc/route.ts — delete after use
// One-time repair: assigns all orphaned QC_IN_PROGRESS chapters (routedToQcId null)
// to an actual QC staff member using the availability-based logic.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQCWithFewestJobs } from "@/lib/assignment";
import { Role } from "@prisma/client";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["MAIN_ADMIN","SUB_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orphaned = await prisma.orderChapter.findMany({
    where: { status: "QC_IN_PROGRESS", routedToQcId: null } as any,
    select: { id: true, chapterLabel: true, order: { select: { topic: true } } },
  });

  const results = [];

  for (const chapter of orphaned) {
    const qcUserId = await getQCWithFewestJobs();
    if (!qcUserId) break;

    await prisma.orderChapter.update({
      where: { id: chapter.id },
      data:  { routedToQcId: qcUserId, routedToQcAt: new Date() } as any,
    });

    const qc = await prisma.user.findUnique({ where: { id: qcUserId }, select: { name: true } });

    await prisma.notification.create({
      data: {
        userId:  qcUserId,
        orderId: undefined,
        title:   "QC Check Assigned to You",
        message: `${chapter.chapterLabel} from "${chapter.order.topic}" needs review. Check your pending tab.`,
        type:    "ACTION_REQUIRED",
      },
    });

    results.push({ chapterId: chapter.id, topic: chapter.order.topic, assignedTo: qc?.name });
  }

  return NextResponse.json({ success: true, repaired: results.length, results });
}
