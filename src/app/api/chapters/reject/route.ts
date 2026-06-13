export const dynamic = "force-dynamic";
// src/app/api/chapters/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterStatus, Role } from "@prisma/client";
import { sendJobAssignedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.WRITER, Role.ANALYST].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chapterId } = await req.json();
  if (!chapterId) return NextResponse.json({ error: "chapterId required." }, { status: 400 });

  const chapter = await prisma.orderChapter.findUnique({
    where:   { id: chapterId },
    include: { order: { select: { id: true, topic: true, department: true, degreeGroup: true } } },
  });

  if (!chapter) return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
  if (chapter.assignedToId !== session.user.id) {
    return NextResponse.json({ error: "This chapter is not assigned to you." }, { status: 403 });
  }
  if (chapter.status !== ChapterStatus.NOT_STARTED) {
    return NextResponse.json({ error: "You can only reject jobs you haven't started yet." }, { status: 409 });
  }

  const rejecterRole = session.user.role; // WRITER or ANALYST

  // ── Find next available staff of same role ───────────────────
  // Get all approved, non-suspended staff of same role except the rejecter
  const candidates = await prisma.user.findMany({
    where: {
      role:        rejecterRole,
      isApproved:  true,
      isSuspended: false,
      id:          { not: session.user.id }, // exclude rejecter
    },
    select: { id: true, name: true, email: true },
  });

  // Count active workload for each candidate
  const withCounts = await Promise.all(
    candidates.map(async (staff) => {
      const count = await prisma.orderChapter.count({
        where: {
          assignedToId: staff.id,
          status: { in: [ChapterStatus.NOT_STARTED, ChapterStatus.IN_PROGRESS, ChapterStatus.PRELIM_SUBMITTED] },
        },
      });
      return { ...staff, count };
    })
  );

  // Sort by workload ascending, oldest staff first on tie
  withCounts.sort((a, b) => a.count - b.count);
  const next = withCounts[0] || null;

  if (next) {
    // Reassign to next staff member
    await prisma.orderChapter.update({
      where: { id: chapterId },
      data: {
        assignedToId: next.id,
        assigneeRole: rejecterRole as any,
        status:       ChapterStatus.NOT_STARTED,
        writerNotes:  `Reassigned from ${session.user.name} (rejected)`,
      },
    });

    // Notify the new assignee
    await prisma.notification.create({
      data: {
        userId:  next.id,
        orderId: chapter.orderId,
        title:   "New Job Assigned",
        message: `${chapter.chapterLabel} for "${chapter.order.topic}" has been assigned to you.`,
        type:    "ACTION_REQUIRED",
      },
    });

    // Send email
    try {
      await sendJobAssignedEmail({
        to:           next.email,
        name:         next.name,
        role:         rejecterRole,
        topic:        chapter.order.topic,
        chapterLabel: chapter.chapterLabel,
        department:   chapter.order.department,
      });
    } catch (e) { console.error("[EMAIL] Reassign:", e); }

    return NextResponse.json({ success: true, message: "Job rejected and reassigned to next available staff." });
  }

  // ── No one else available — notify admin ─────────────────────
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      assignedToId: null,
      assigneeRole: null,
      status:       ChapterStatus.NOT_STARTED,
      writerNotes:  `Rejected by ${session.user.name} — no other staff available`,
    },
  });

  const admins = await prisma.user.findMany({
    where:  { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } },
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: admins.map(a => ({
      userId:  a.id,
      orderId: chapter.orderId,
      title:   "⚠️ Chapter Unassigned — No Staff Available",
      message: `${chapter.chapterLabel} for "${chapter.order.topic}" was rejected by all available ${rejecterRole.toLowerCase()}s. Please assign manually in All Orders.`,
      type:    "ALERT" as const,
    })),
  });

  return NextResponse.json({ success: true, message: "Job rejected. No other staff available — admin has been notified." });
}
