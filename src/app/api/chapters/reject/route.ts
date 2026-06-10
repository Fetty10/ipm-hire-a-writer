export const dynamic = "force-dynamic";
// src/app/api/chapters/reject/route.ts
// Called when a writer/analyst/QC rejects an assigned job
// Reassigns to the next available staff with fewest active jobs
// If nobody available, notifies admin

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role, AssigneeRole } from "@prisma/client";

// Map Role → AssigneeRole
const ROLE_MAP: Partial<Record<Role, AssigneeRole>> = {
  [Role.WRITER]:  AssigneeRole.WRITER,
  [Role.ANALYST]: AssigneeRole.ANALYST,
  [Role.QC]:      AssigneeRole.QC,
};

async function getNextAvailableStaff(
  role: Role,
  excludeUserId: string
): Promise<string | null> {
  const staff = await prisma.user.findMany({
    where: {
      role,
      isApproved:  true,
      isSuspended: false,
      id:          { not: excludeUserId },
    },
    select: { id: true },
  });

  if (staff.length === 0) return null;

  const counts = await Promise.all(
    staff.map(async (s) => ({
      id: s.id,
      count: await prisma.orderChapter.count({
        where: {
          assignedToId: s.id,
          status: {
            notIn: [ChapterStatus.DELIVERED, ChapterStatus.QC_DONE],
          },
        },
      }),
    }))
  );

  counts.sort((a, b) => a.count - b.count);
  return counts[0]?.id ?? null;
}

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

  const chapter = await prisma.orderChapter.findFirst({
    where: {
      id:           chapterId,
      assignedToId: session.user.id,
      status:       { in: [ChapterStatus.NOT_STARTED, ChapterStatus.IN_PROGRESS] },
    },
    include: {
      order: { select: { topic: true, clientId: true } },
    },
  });

  if (!chapter) {
    return NextResponse.json(
      { error: "Chapter not found or cannot be rejected at this stage." },
      { status: 404 }
    );
  }

  // Find next available staff
  const nextStaffId = await getNextAvailableStaff(role, session.user.id);

  if (nextStaffId) {
    // Reassign to next staff
    await prisma.orderChapter.update({
      where: { id: chapterId },
      data: {
        assignedToId: nextStaffId,
        assigneeRole: ROLE_MAP[role],
        status:       ChapterStatus.NOT_STARTED,
      },
    });

    // Notify new staff
    await prisma.notification.create({
      data: {
        userId:  nextStaffId,
        orderId: chapter.orderId,
        title:   "New Job Assigned",
        message: `A ${chapter.chapterLabel} for "${chapter.order.topic}" has been assigned to you.`,
        type:    "ACTION_REQUIRED",
      },
    });
  } else {
    // No staff available — notify all admins
    await prisma.orderChapter.update({
      where: { id: chapterId },
      data: {
        assignedToId: null,
        assigneeRole: null,
        status:       ChapterStatus.NOT_STARTED,
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId:  admin.id,
        orderId: chapter.orderId,
        title:   "⚠️ No Staff Available for Assignment",
        message: `All ${role.toLowerCase()}s have rejected or are unavailable for ${chapter.chapterLabel} on "${chapter.order.topic}". Manual assignment required.`,
        type:    "ALERT" as const,
      })),
    });
  }

  return NextResponse.json({
    success: true,
    reassigned: !!nextStaffId,
    message: nextStaffId
      ? "Job rejected and reassigned to next available staff."
      : "Job rejected. Admin has been notified — manual assignment required.",
  });
}
