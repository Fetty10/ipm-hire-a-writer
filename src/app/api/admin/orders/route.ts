export const dynamic = "force-dynamic";
// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  // ── Single order fetch ──────────────────────────────────────
  if (orderId) {
    const o = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client:   { select: { id: true, name: true, phone: true, email: true } },
        plan:     { select: { planName: true, degreeGroup: true } },
        chapters: {
          select: {
            id: true, chapterLabel: true, chapterNumber: true, status: true,
            assignedToId: true, assigneeRole: true, correctionNotes: true,
            submittedFileUrl: true, deliveredFileUrl: true, qcFileUrl: true,
            plagiarismScore: true, aiScore: true, isUrgent: true,
            routedToQcId: true, routedToQcAt: true,
            assignedTo: { select: { id: true, name: true, role: true } },
          },
          orderBy: { chapterNumber: "asc" },
        },
      },
    });
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Resolve QC names separately since routedToQcId has no Prisma relation defined
    const qcIds = [...new Set(o.chapters.map((ch:any) => ch.routedToQcId).filter(Boolean))];
    const qcUsers = qcIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: qcIds as string[] } }, select: { id: true, name: true } })
      : [];
    const qcMap = Object.fromEntries(qcUsers.map(u => [u.id, u.name]));

    return NextResponse.json({
      success: true,
      data: {
        id: o.id, topic: o.topic, department: o.department,
        degreeGroup: o.degreeGroup, status: o.status,
        planName: o.plan.planName, amountPaid: (o.amountPaidKobo || 0) / 100,
        amountPaidKobo: o.amountPaidKobo || 0,
        requiresPlagiarismCheck: o.requiresPlagiarismCheck,
        requiresAiCheck: o.requiresAiCheck,
        specialInstructions: o.specialInstructions,
        guidelineFileUrl: o.guidelineFileUrl,
        adminNote: o.adminNote || null,
        student: o.client,
        client:  o.client,
        chapters: o.chapters.map((ch: any) => ({
          ...ch,
          qcName: ch.routedToQcId ? (qcMap[ch.routedToQcId] || "Unknown") : null,
        })),
        createdAt: o.createdAt, paidAt: o.paidAt,
        paymentMethod:         (o as any).paymentMethod || "PAYSTACK",
        bankTransferReference: (o as any).bankTransferReference || null,
      },
    });
  }

  // ── List fetch ──────────────────────────────────────────────
  const status  = searchParams.get("status") as OrderStatus | "all" | null;
  const search  = searchParams.get("search") || "";
  const page    = parseInt(searchParams.get("page") || "1");
  const perPage = 20;

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { topic:              { contains: search, mode: "insensitive" } },
      { client: { name:    { contains: search, mode: "insensitive" } } },
      { client: { phone:   { contains: search, mode: "insensitive" } } },
      { client: { email:   { contains: search, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, skip: (page - 1) * perPage, take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        plan:   { select: { planName: true, degreeGroup: true } },
        chapters: {
          select: {
            id: true, chapterLabel: true, chapterNumber: true, status: true,
            assignedToId: true, assigneeRole: true,
            assignedTo: { select: { id: true, name: true, role: true } },
          },
          orderBy: { chapterNumber: "asc" },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      orders: orders.map(o => ({
        id: o.id, topic: o.topic, department: o.department,
        degreeGroup: o.degreeGroup, status: o.status,
        planName: o.plan.planName, amountPaid: (o.amountPaidKobo || 0) / 100,
        amountPaidKobo: o.amountPaidKobo || 0,
        requiresPlagiarismCheck: o.requiresPlagiarismCheck,
        requiresAiCheck: o.requiresAiCheck,
        student: o.client,
        client:  o.client,
        chapters: o.chapters,
        createdAt: o.createdAt, paidAt: o.paidAt,
        paymentMethod:         (o as any).paymentMethod || "PAYSTACK",
        bankTransferReference: (o as any).bankTransferReference || null,
        adminNote:             o.adminNote || null,
      })),
      total, page, pages: Math.ceil(total / perPage),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, orderId, chapterId, staffId, notes } = body;

  if (!action || !orderId) {
    return NextResponse.json({ error: "action and orderId are required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // ── Add/update admin note ─────────────────────────────────────
  if (action === "add_note") {
    await prisma.order.update({
      where: { id: orderId },
      data:  { adminNote: notes?.trim() || null },
    });
    return NextResponse.json({ success: true, message: "Note saved." });
  }

  // ── Reassign chapter to a different staff member ─────────────
  if (action === "reassign_chapter") {
    if (!chapterId || !staffId) {
      return NextResponse.json({ error: "chapterId and staffId are required." }, { status: 400 });
    }
    const staff = await prisma.user.findUnique({ where: { id: staffId } });
    if (!staff) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });

    await prisma.orderChapter.update({
      where: { id: chapterId },
      data: {
        assignedToId: staffId,
        assigneeRole: staff.role as any,
        status:       "NOT_STARTED",
        startedAt:    null,
        deadlineAt:   null,
      } as any,
    });

    await prisma.notification.create({
      data: {
        userId:  staffId,
        orderId,
        title:   "New Job Reassigned to You",
        message: `A chapter for "${order.topic}" has been reassigned to you by admin. Check your pending jobs.`,
        type:    "ACTION_REQUIRED",
      },
    });

    return NextResponse.json({ success: true, message: "Chapter reassigned." });
  }

  // ── Mark/unmark chapter as urgent — notify the assigned staff ──
  if (action === "mark_urgent" || action === "unmark_urgent") {
    if (!chapterId) return NextResponse.json({ error: "chapterId is required." }, { status: 400 });

    const isUrgent = action === "mark_urgent";

    const chapter = await prisma.orderChapter.update({
      where: { id: chapterId },
      data:  { isUrgent, urgentMarkedAt: isUrgent ? new Date() : null } as any,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });

    // Determine who to notify — assigned staff, or the QC handling it
    const recipientId = (chapter as any).routedToQcId || chapter.assignedToId;

    if (isUrgent && recipientId) {
      await prisma.notification.create({
        data: {
          userId:  recipientId,
          orderId,
          title:   "🚨 Urgent: Priority Job",
          message: `${chapter.chapterLabel} for "${order.topic}" has been marked URGENT by admin. Please prioritise this job.`,
          type:    "ALERT" as any,
        },
      });

      // Send email if we have the recipient's contact
      const recipient = chapter.assignedTo?.id === recipientId
        ? chapter.assignedTo
        : await prisma.user.findUnique({ where: { id: recipientId }, select: { id:true, name:true, email:true } });

      if (recipient?.email) {
        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY!);
          await resend.emails.send({
            from: "iProjectMaster <noreply@hire.iprojectmaster.com>",
            to:   recipient.email,
            subject: `🚨 Urgent Job — ${chapter.chapterLabel}`,
            html: `
              <div style="font-family:'DM Sans',sans-serif;max-width:480px;margin:0 auto;padding:1.5rem;background:#fff;border-radius:14px;border:1px solid #FECACA;">
                <h2 style="color:#991B1B;font-size:1.1rem;margin:0 0 .5rem;">🚨 This job is now URGENT</h2>
                <p style="color:#5B7EA6;font-size:.85rem;line-height:1.6;">Hi ${recipient.name}, admin has marked <strong>${chapter.chapterLabel}</strong> for "${order.topic}" as urgent. Please log in and prioritise this job above your other pending work.</p>
              </div>
            `,
          });
        } catch (e) { console.error("[EMAIL] Urgent notify:", e); }
      }
    }

    return NextResponse.json({ success: true, message: isUrgent ? "Marked as urgent. Staff notified." : "Urgent flag removed." });
  }

  // ── Reset chapter (unassign, back to NOT_STARTED) ─────────────
  if (action === "reset_chapter") {
    if (!chapterId) return NextResponse.json({ error: "chapterId is required." }, { status: 400 });
    await prisma.orderChapter.update({
      where: { id: chapterId },
      data: {
        status:       "NOT_STARTED",
        assignedToId: null,
        assigneeRole: null,
        startedAt:    null,
        deadlineAt:   null,
        submittedFileUrl: null,
        submittedAt:      null,
        routedToQcId: null,
        routedToQcAt: null,
      } as any,
    });
    return NextResponse.json({ success: true, message: "Chapter reset." });
  }

  // ── Mark entire order as delivered ────────────────────────────
  if (action === "mark_delivered") {
    await prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } });
    await prisma.orderChapter.updateMany({
      where: { orderId },
      data:  { status: "DELIVERED", deliveredAt: new Date() },
    });
    await prisma.notification.create({
      data: {
        userId:  order.clientId,
        orderId,
        title:   "Order Delivered",
        message: `Your order "${order.topic}" has been marked as fully delivered.`,
        type:    "SUCCESS" as any,
      },
    });
    return NextResponse.json({ success: true, message: "Order marked as delivered." });
  }

  // ── Cancel order ───────────────────────────────────────────────
  if (action === "cancel") {
    await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    await prisma.notification.create({
      data: {
        userId:  order.clientId,
        orderId,
        title:   "Order Cancelled",
        message: `Your order "${order.topic}" has been cancelled. Contact support if you have questions.`,
        type:    "ALERT" as any,
      },
    });
    return NextResponse.json({ success: true, message: "Order cancelled." });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
