// src/lib/assignment.ts
// Core job assignment engine
// Called after Paystack payment webhook confirms a payment

import { prisma } from "@/lib/prisma";
import { sendChapterDeliveredEmail, sendJobAssignedEmail, sendQCCheckAssignedEmail, sendPrelimReadyEmail, sendLegacyCorrectionDeliveredEmail } from "@/lib/email";
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

async function getStaffWithFewestJobs(role: Role, tiebreakSeed?: string): Promise<string | null> {
  // Get all approved, non-suspended staff of this role
  const staffList = await prisma.user.findMany({
    where: {
      role,
      isApproved:  true,
      isSuspended: false,
    },
    select:  { id: true },
    orderBy: { createdAt: "asc" }, // older staff first as base ordering
  });

  if (staffList.length === 0) return null;
  if (staffList.length === 1) return staffList[0].id;

  // Count active chapters per staff member
  // Include NOT_STARTED + IN_PROGRESS + PRELIM_SUBMITTED
  const activeCounts = await Promise.all(
    staffList.map(async (staff) => {
      const count = await prisma.orderChapter.count({
        where: {
          assignedToId: staff.id,
          status: {
            in: [
              ChapterStatus.NOT_STARTED,
              ChapterStatus.IN_PROGRESS,
              ChapterStatus.PRELIM_SUBMITTED,
            ],
          },
        },
      });
      return { id: staff.id, count };
    })
  );

  // Sort ascending by count
  activeCounts.sort((a, b) => a.count - b.count);

  const minCount = activeCounts[0].count;
  const tied = activeCounts.filter(s => s.count === minCount);

  if (tied.length === 1) return tied[0].id;

  // If multiple writers are tied, use a deterministic but varied tiebreaker
  // based on orderId (or current timestamp) so simultaneous orders that
  // both see the same "fewest jobs" count still go to different writers.
  // This avoids the race condition where two orders arrive before either
  // chapter is written to the DB.
  if (tiebreakSeed) {
    // Use a simple hash of the seed to pick deterministically but spread evenly
    let hash = 0;
    for (let i = 0; i < tiebreakSeed.length; i++) {
      hash = ((hash << 5) - hash) + tiebreakSeed.charCodeAt(i);
      hash |= 0;
    }
    return tied[Math.abs(hash) % tied.length].id;
  }

  // No seed — fall back to random
  return tied[Math.floor(Math.random() * tied.length)].id;
}

// ─────────────────────────────────────────────────────────────
// CHECK IF DEPARTMENT IS AN EXCEPTION
// ─────────────────────────────────────────────────────────────

async function isExceptionDepartment(department: string): Promise<boolean> {
  // Fuzzy match — student typing "Faculty of Law" or "law" both match admin entry "Law"
  const all = await prisma.exceptionDepartment.findMany({ select: { name: true } });
  const dept = department.toLowerCase().trim();
  return all.some(e => {
    const exc = e.name.toLowerCase().trim();
    return dept.includes(exc) || exc.includes(dept);
  });
}

// ─────────────────────────────────────────────────────────────
// QC-SPECIFIC WORKLOAD COUNTER
// QC workload = chapters they have actively started (routedToQcId set, not yet cleared)
export async function getQCWithFewestJobs(tiebreakSeed?: string): Promise<string | null> {
  const staffList = await prisma.user.findMany({
    where:   { role: Role.QC, isApproved: true, isSuspended: false },
    select:  { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (staffList.length === 0) return null;
  if (staffList.length === 1) return staffList[0].id;

  const counts = await Promise.all(
    staffList.map(async (staff) => {
      const count = await prisma.orderChapter.count({
        where: {
          routedToQcId: staff.id,
          status:       ChapterStatus.QC_IN_PROGRESS,
        },
      });
      return { id: staff.id, count };
    })
  );

  counts.sort((a, b) => a.count - b.count);
  const minCount = counts[0].count;
  const tied = counts.filter(c => c.count === minCount);

  if (tied.length === 1) return tied[0].id;

  if (tiebreakSeed) {
    let hash = 0;
    for (let i = 0; i < tiebreakSeed.length; i++) {
      hash = ((hash << 5) - hash) + tiebreakSeed.charCodeAt(i);
      hash |= 0;
    }
    return tied[Math.abs(hash) % tied.length].id;
  }

  return tied[Math.floor(Math.random() * tied.length)].id;
}

// ─────────────────────────────────────────────────────────────
// STRICT ROUND-ROBIN FOR CORRECTIONS
// Unlike regular QC checks (availability-based), corrections rotate
// strictly in order — Peter, Timothy, Peter, Timothy... — regardless
// of current workload. New QC staff join the rotation automatically
// based on join order (createdAt).
// ─────────────────────────────────────────────────────────────
export async function getNextQCForCorrectionRoundRobin(): Promise<string | null> {
  const staffList = await prisma.user.findMany({
    where:   { role: Role.QC, isApproved: true, isSuspended: false },
    select:  { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (staffList.length === 0) return null;
  if (staffList.length === 1) return staffList[0].id;

  const state = await (prisma as any).correctionRotationState.findUnique({ where: { id: "singleton" } });
  const lastId = state?.lastAssignedQcId;

  let nextIndex = 0;
  if (lastId) {
    const lastIndex = staffList.findIndex(s => s.id === lastId);
    if (lastIndex !== -1) {
      nextIndex = (lastIndex + 1) % staffList.length;
    }
  }

  const nextQc = staffList[nextIndex].id;

  // Persist for next time
  await (prisma as any).correctionRotationState.upsert({
    where:  { id: "singleton" },
    update: { lastAssignedQcId: nextQc, updatedAt: new Date() },
    create: { id: "singleton", lastAssignedQcId: nextQc },
  });

  return nextQc;
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
  // Flat services (seminar, proposal, topic etc.) get 1 chapter → Writer only
  const isProjectService = order.serviceType === "HIRE_WRITER" || !order.serviceType;
  const SERVICE_LABELS: Record<string,string> = {
    PROPOSAL_SEMINAR:      "Seminar / Proposal",
    JOURNAL_WRITING:       "Journal / Article",
    JOURNAL_SOURCING:      "Journal Sourcing",
    TOPIC_SUGGESTION:      "Topic Coining",
    CASE_STUDY_ADJUSTMENT: "Case Study",
    COMPLETE_PROJECT:      "Complete Project",
  };

  const requestedNums: number[] = isProjectService
    ? (order.selectedChapters
        ? order.selectedChapters.split(",").map(Number).filter(Boolean)
        : [1, 2, 3, 4, 5])
    : [1]; // flat services always just 1 chapter

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
        chapterNumber:  num,
        chapterLabel:   isProjectService ? `Chapter ${num}` : (SERVICE_LABELS[order.serviceType] || `Chapter ${num}`),
        role:           Role.WRITER,
        assigneeRole:   AssigneeRole.WRITER,
        requiresPrelim: isProjectService && num === PRELIM_REQUIRED_CHAPTER,
      });
    }
  } else if (!isProjectService) {
    // Flat service — 1 chapter to writer, no prelim needed
    chaptersToCreate.push({
      chapterNumber:  1,
      chapterLabel:   SERVICE_LABELS[order.serviceType] || "Assignment",
      role:           Role.WRITER,
      assigneeRole:   AssigneeRole.WRITER,
      requiresPrelim: false,
    });
  } else {
    // Writer chapters (1, 2, 5) that were requested
    for (const num of WRITER_CHAPTERS.filter(n => requestedNums.includes(n))) {
      chaptersToCreate.push({
        chapterNumber:  num,
        chapterLabel:   `Chapter ${num}`,
        role:           Role.WRITER,
        assigneeRole:   AssigneeRole.WRITER,
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
  // Pass orderId as a tiebreak seed so simultaneous orders that see
  // identical job counts still get distributed to different staff.
  const writerId = await getStaffWithFewestJobs(Role.WRITER, orderId);

  // Only fetch an analyst for project orders that actually have analyst
  // chapters (Ch 3 & 4). Flat/other services and exception departments
  // never need an analyst — fetching one here caused false notifications.
  const needsAnalyst = !isException && isProjectService &&
    ANALYST_CHAPTERS.some(n => requestedNums.includes(n));
  const analystId = needsAnalyst
    ? await getStaffWithFewestJobs(Role.ANALYST, orderId)
    : null;

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
    const writer = await prisma.user.findUnique({ where: { id: writerId }, select: { email: true, name: true } });
    await prisma.notification.create({
      data: {
        userId:  writerId,
        orderId,
        title:   "New Writing Job Assigned",
        message: `You have been assigned chapters for a new order: "${order.topic}". Please log in to your dashboard to begin.`,
        type:    "ACTION_REQUIRED",
      },
    });
    if (writer) {
      try {
        await sendJobAssignedEmail({
          to:           writer.email,
          name:         writer.name,
          role:         "WRITER",
          topic:        order.topic,
          chapterLabel: "Chapter(s)",
          department:   order.department,
        });
      } catch (e) { console.error("[EMAIL] Writer job assigned:", e); }
    }
    notified.add(writerId);
  }

  const analystHasChapters = chaptersToCreate.some(ch => ch.role === Role.ANALYST);

  if (analystId && analystHasChapters && !notified.has(analystId)) {
    const analyst = await prisma.user.findUnique({ where: { id: analystId }, select: { email: true, name: true } });
    await prisma.notification.create({
      data: {
        userId:  analystId,
        orderId,
        title:   "New Analysis Job Assigned",
        message: `You have been assigned chapters for a new order: "${order.topic}". Please log in to your dashboard to begin.`,
        type:    "ACTION_REQUIRED",
      },
    });
    if (analyst) {
      try {
        await sendJobAssignedEmail({
          to:           analyst.email,
          name:         analyst.name,
          role:         "ANALYST",
          topic:        order.topic,
          chapterLabel: "Chapter(s)",
          department:   order.department,
        });
      } catch (e) { console.error("[EMAIL] Analyst job assigned:", e); }
    }
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

  // Check if this order's department has a dedicated QC staff
  const exceptionDept = await prisma.exceptionDepartment.findFirst({
    where:  { dedicatedQcId: { not: null } },
    select: { name: true, dedicatedQcId: true },
  }).then(async (dept) => {
    if (!dept) return null;
    // Fuzzy match — same logic as isExceptionDepartment
    const dept2 = order.department.toLowerCase().trim();
    const exc   = dept.name.toLowerCase().trim();
    if (dept2.includes(exc) || exc.includes(dept2)) return dept;
    return null;
  });

  // Use dedicated QC for this department, otherwise pick by fewest jobs
  const qcUserId = (exceptionDept?.dedicatedQcId) || await getQCWithFewestJobs(chapterId);
  if (!qcUserId) return; // no QC available

  const checks: string[] = [];
  if (order.requiresPlagiarismCheck) checks.push("Plagiarism Check");
  if (order.requiresAiCheck)         checks.push("AI Detection Check");
  if (checks.length === 0)           checks.push("Quality Review");

  // Assign directly to specific QC — they see it in their Pending tab only
  await prisma.orderChapter.update({
    where: { id: chapterId },
    data: {
      status:       ChapterStatus.QC_IN_PROGRESS,
      routedToQcId: qcUserId,
      routedToQcAt: new Date(),
      qcStartedAt:  null, // reset — fresh QC review, not yet started
    } as any,
  });

  // Notify only the assigned QC
  const qc = await prisma.user.findUnique({
    where:  { id: qcUserId },
    select: { id: true, email: true, name: true },
  });

  if (qc) {
    await prisma.notification.create({
      data: {
        userId:  qc.id,
        orderId: order.id,
        title:   "QC Check Assigned to You",
        message: `${chapter.chapterLabel} from "${order.topic}" needs ${checks.join(" & ")}. Check your pending tab.`,
        type:    "ACTION_REQUIRED",
      },
    });
    try {
      await sendQCCheckAssignedEmail({
        to:           qc.email,
        name:         qc.name,
        topic:        order.topic,
        chapterLabel: chapter.chapterLabel,
        checks,
      });
    } catch (e) { console.error("[EMAIL] QC assigned:", e); }
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

  // Send delivery email — legacy clients (lodged by admin) get a direct
  // download link in their email so they don't need to find their dashboard.
  // All other clients get the standard dashboard link.
  const isLegacy = !!(chapter.order as any).adminNote?.includes("Legacy correction");

  try {
    if (isLegacy) {
      await sendLegacyCorrectionDeliveredEmail({
        to:           chapter.order.client.email,
        name:         chapter.order.client.name,
        topic:        chapter.order.topic,
        chapterLabel: chapter.chapterLabel,
        fileUrl:      deliveredFileUrl,
      });
    } else {
      await sendChapterDeliveredEmail({
        to:           chapter.order.client.email,
        name:         chapter.order.client.name,
        topic:        chapter.order.topic,
        chapterLabel: chapter.chapterLabel,
        orderId:      chapter.order.id,
        planName:     chapter.order.plan.planName,
      });
    }
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
      const staff = await prisma.user.findUnique({ where: { id: assignedToId }, select: { email: true, name: true, role: true } });
      await prisma.notification.create({
        data: {
          userId:  assignedToId,
          orderId,
          title:   "New Chapter Assigned",
          message: `Chapter ${num} for "${order.topic}" has been added and assigned to you. Log in to your dashboard to begin.`,
          type:    "ACTION_REQUIRED",
        },
      });
      if (staff) {
        try {
          await sendJobAssignedEmail({
            to:           staff.email,
            name:         staff.name,
            role:         staff.role,
            topic:        order.topic,
            chapterLabel: `Chapter ${num}`,
            department:   order.department,
          });
        } catch (e) { console.error("[EMAIL] Specific chapter assigned:", e); }
      }
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
