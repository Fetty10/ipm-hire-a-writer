// src/lib/assignment.ts
// Core job assignment engine
// Called after Paystack payment webhook confirms a payment

import { prisma } from "@/lib/prisma";
import { sendChapterDeliveredEmail } from "@/lib/email";
import { AssigneeRole, ChapterStatus, DegreeGroup, Role } from "@prisma/client";

// ─────────────────────────────────────────────────────────────
// CHAPTER DEFINITIONS
// Standard split: Writer → Ch 1,2,5 | Analyst → Ch 3,4
// Exception dept: Writer → ALL chapters
// ─────────────────────────────────────────────────────────────

const WRITER_CHAPTERS  = [1, 2, 5];
const ANALYST_CHAPTERS = [3, 4];

// Chapter 1 always requires preliminary uploads (in non-exception depts)
const PRELIM_REQUIRED_CHAPTER = 1;

// ─────────────────────────────────────────────────────────────
// FIND STAFF WITH FEWEST ACTIVE JOBS
// ─────────────────────────────────────────────────────────────

async function getStaffWithFewestJobs(role: Role): Promise<string | null> {
  // Get all approved, non-suspended staff of this role
  const staffList = await prisma.user.findMany({
    where: {
      role,
      isApproved:  true,
      isSuspended: false,
    },
    select: { id: true },
  });

  if (staffList.length === 0) return null;

  // Count active chapters per staff member
  const activeCounts = await Promise.all(
    staffList.map(async (staff) => {
      const count = await prisma.orderChapter.count({
        where: {
          assignedToId: staff.id,
          status: {
            notIn: [ChapterStatus.DELIVERED, ChapterStatus.QC_DONE],
          },
        },
      });
      return { id: staff.id, count };
    })
  );

  // Sort ascending — pick the one with the least active jobs
  activeCounts.sort((a, b) => a.count - b.count);
  return activeCounts[0].id;
}

// ─────────────────────────────────────────────────────────────
// CHECK IF DEPARTMENT IS AN EXCEPTION
// ─────────────────────────────────────────────────────────────

async function isExceptionDepartment(department: string): Promise<boolean> {
  const match = await prisma.exceptionDepartment.findFirst({
    where: { name: { equals: department, mode: "insensitive" } },
  });
  return !!match;
}

// ─────────────────────────────────────────────────────────────
// MAIN ASSIGNMENT FUNCTION
// Called with orderId after payment is confirmed
// ─────────────────────────────────────────────────────────────

export async function assignChaptersForOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { plan: true },
  });

  if (!order) throw new Error(`Order ${orderId} not found`);

  const isException = await isExceptionDepartment(order.department);

  // Update the order flag
  await prisma.order.update({
    where: { id: orderId },
    data:  { isExceptionDept: isException },
  });

  // ── Determine what chapters to create ────────────────────
  // If student selected specific chapters (per-chapter plan), only create those
  // Otherwise create all 5 chapters
  const requestedNums: number[] = order.selectedChapters
    ? order.selectedChapters.split(",").map(Number).filter(Boolean)
    : [1, 2, 3, 4, 5];

  const chaptersToCreate: Array<{
    chapterNumber: number;
    chapterLabel:  string;
    role:          Role;
    assigneeRole:  AssigneeRole;
    requiresPrelim: boolean;
  }> = [];

  if (isException) {
    // All requested chapters → Writer
    for (const num of requestedNums) {
      chaptersToCreate.push({
        chapterNumber: num,
        chapterLabel:  `Chapter ${num}`,
        role:          Role.WRITER,
        assigneeRole:  AssigneeRole.WRITER,
        requiresPrelim: num === PRELIM_REQUIRED_CHAPTER,
      });
    }
  } else {
    // Writer chapters (1, 2, 5) that were requested
    for (const num of WRITER_CHAPTERS.filter(n => requestedNums.includes(n))) {
      chaptersToCreate.push({
        chapterNumber: num,
        chapterLabel:  `Chapter ${num}`,
        role:          Role.WRITER,
        assigneeRole:  AssigneeRole.WRITER,
        requiresPrelim: num === PRELIM_REQUIRED_CHAPTER,
      });
    }
    // Analyst chapters (3, 4) that were requested
    for (const num of ANALYST_CHAPTERS.filter(n => requestedNums.includes(n))) {
      chaptersToCreate.push({
        chapterNumber: num,
        chapterLabel:  `Chapter ${num}`,
        role:          Role.ANALYST,
        assigneeRole:  AssigneeRole.ANALYST,
        requiresPrelim: false,
      });
    }
  }

  // ── Find best staff for each role ────────────────────────
  const writerId  = await getStaffWithFewestJobs(Role.WRITER);
  const analystId = isException ? null : await getStaffWithFewestJobs(Role.ANALYST);

  // ── Create OrderChapter records ──────────────────────────
  for (const ch of chaptersToCreate) {
    const assignedToId =
      ch.role === Role.WRITER ? writerId : analystId;

    await prisma.orderChapter.create({
      data: {
        orderId,
        chapterNumber:  ch.chapterNumber,
        chapterLabel:   ch.chapterLabel,
        assignedToId:   assignedToId ?? undefined,
        assigneeRole:   assignedToId ? ch.assigneeRole : undefined,
        status:         ChapterStatus.NOT_STARTED,
        requiresPrelim: ch.requiresPrelim,
      },
    });
  }

  // ── Notify assigned staff ─────────────────────────────────
  const notified = new Set<string>();

  if (writerId && !notified.has(writerId)) {
    await prisma.notification.create({
      data: {
        userId:  writerId,
        orderId,
        title:   "New Writing Job Assigned",
        message: `You have been assigned chapters for a new order: "${order.topic}". Please log in to your dashboard to begin.`,
        type:    "ACTION_REQUIRED",
      },
    });
    notified.add(writerId);
  }

  if (analystId && !notified.has(analystId)) {
    await prisma.notification.create({
      data: {
        userId:  analystId,
        orderId,
        title:   "New Analysis Job Assigned",
        message: `You have been assigned chapters for a new order: "${order.topic}". Please log in to your dashboard to begin.`,
        type:    "ACTION_REQUIRED",
      },
    });
    notified.add(analystId);
  }

  // ── Notify client ─────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId:  order.clientId,
      orderId,
      title:   "Your Order is Now In Progress",
      message: `Great news! Your order for "${order.topic}" has been assigned to our writing team. You can track the progress from your dashboard.`,
      type:    "INFO",
    },
  });
}

// ─────────────────────────────────────────────────────────────
// ROUTE CHAPTER TO QC
// Called when a writer/analyst submits a chapter on an order
// that requires plagiarism or AI check
// ─────────────────────────────────────────────────────────────

export async function routeChapterToQC(chapterId: string): Promise<void> {
  const chapter = await prisma.orderChapter.findUnique({
    where: { id: chapterId },
    include: { order: { include: { plan: true } } },
  });

  if (!chapter) throw new Error(`Chapter ${chapterId} not found`);

  const order = chapter.order;

  // Check order flags AND plan name directly (covers orders placed before flags were set)
  const isProfessionalPlan =
    order.plan.planName === "PROFESSIONAL" ||
    order.plan.planName === "PHD_PROFESSIONAL";

  const needsQc = order.requiresPlagiarismCheck || order.requiresAiCheck || isProfessionalPlan;

  if (!needsQc) return; // no QC needed — caller handles direct delivery

  const qcUserId = await getStaffWithFewestJobs(Role.QC);

  // Set status to QC_IN_PROGRESS but leave routedToQcId null
  // so any available QC can pick it up from Pending Checks
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:       ChapterStatus.QC_IN_PROGRESS,
      routedToQcAt: new Date(),
    },
  });

  // Notify all QC staff (or specific one if assigned)
  const qcToNotify = qcUserId;
  if (qcToNotify) {
    await prisma.notification.create({
      data: {
        userId:  qcToNotify,
        orderId: order.id,
        title:   "QC Check Required",
        message: `A chapter from order "${order.topic}" has been submitted and requires ${
          order.requiresPlagiarismCheck && order.requiresAiCheck
            ? "plagiarism and AI checks"
            : order.requiresPlagiarismCheck
            ? "a plagiarism check"
            : "an AI check"
        }. Please log in to review.`,
        type: "ACTION_REQUIRED",
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// DELIVER CHAPTER TO CLIENT
// Called after QC clears a chapter (or directly if no QC needed)
// ─────────────────────────────────────────────────────────────

export async function deliverChapterToClient(
  chapterId: string,
  deliveredFileUrl: string
): Promise<void> {
  const chapter = await prisma.orderChapter.findUnique({
    where: { id: chapterId },
    include: {
      order:      { include: { plan: true, client: true } },
      assignedTo: true,
      earnings:   true,
    },
  });

  if (!chapter) throw new Error(`Chapter ${chapterId} not found`);

  // Mark chapter as delivered
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:          ChapterStatus.DELIVERED,
      deliveredFileUrl,
      deliveredAt:     new Date(),
    },
  });

  // Unlock earnings for all staff on this chapter
  await prisma.earning.updateMany({
    where: {
      orderChapterId: chapterId,
      status:         "PENDING",
    },
    data: {
      status:      "AVAILABLE",
      availableAt: new Date(),
    },
  });

  // Notify client
  await prisma.notification.create({
    data: {
      userId:  chapter.order.clientId,
      orderId: chapter.order.id,
      title:   `${chapter.chapterLabel} Delivered`,
      message: `Your ${chapter.chapterLabel} for "${chapter.order.topic}" is ready. Log in to your dashboard to download it.`,
      type:    "SUCCESS",
    },
  });

  // Send delivery email to student
  try {
    await sendChapterDeliveredEmail({
      to:           chapter.order.client.email,
      name:         chapter.order.client.name,
      topic:        chapter.order.topic,
      chapterLabel: chapter.chapterLabel,
      orderId:      chapter.order.id,
      planName:     chapter.order.plan.planName,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send chapter delivered email:", err);
  }

  // Check if all chapters are delivered → mark order as DELIVERED
  const allChapters = await prisma.orderChapter.findMany({
    where: { orderId: chapter.orderId },
  });

  const allDone = allChapters.every(
    (c) => c.status === ChapterStatus.DELIVERED
  );

  if (allDone) {
    await prisma.order.update({
      where: { id: chapter.orderId },
      data:  { status: "DELIVERED" },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// ASSIGN SPECIFIC CHAPTERS TO EXISTING ORDER
// Called when student adds more chapters to an existing order
// ─────────────────────────────────────────────────────────────

export async function assignSpecificChapters(
  orderId: string,
  chapterNumbers: number[]
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { plan: true },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const isException = await isExceptionDepartment(order.department);
  const writerId    = await getStaffWithFewestJobs(Role.WRITER);
  const analystId   = isException ? null : await getStaffWithFewestJobs(Role.ANALYST);

  for (const num of chapterNumbers) {
    const isWriterChapter  = isException || WRITER_CHAPTERS.includes(num);
    const assignedToId     = isWriterChapter ? writerId : analystId;
    const assigneeRole     = isWriterChapter ? AssigneeRole.WRITER : AssigneeRole.ANALYST;
    const role             = isWriterChapter ? Role.WRITER : Role.ANALYST;

    await prisma.orderChapter.create({
      data: {
        orderId,
        chapterNumber:  num,
        chapterLabel:   `Chapter ${num}`,
        assignedToId:   assignedToId ?? undefined,
        assigneeRole:   assignedToId ? assigneeRole : undefined,
        status:         ChapterStatus.NOT_STARTED,
        requiresPrelim: num === PRELIM_REQUIRED_CHAPTER,
      },
    });

    // Notify the assigned staff
    if (assignedToId) {
      await prisma.notification.create({
        data: {
          userId:  assignedToId,
          orderId,
          title:   "New Chapter Assigned",
          message: `Chapter ${num} for "${order.topic}" has been added and assigned to you. Log in to your dashboard to begin.`,
          type:    "ACTION_REQUIRED",
        },
      });
    }
  }

  // Notify student
  await prisma.notification.create({
    data: {
      userId:  order.clientId,
      orderId,
      title:   "Additional Chapters Added",
      message: `Your additional chapter${chapterNumbers.length > 1 ? "s" : ""} (${chapterNumbers.map(n => `Chapter ${n}`).join(", ")}) for "${order.topic}" have been assigned to our writing team.`,
      type:    "INFO",
    },
  });
}
