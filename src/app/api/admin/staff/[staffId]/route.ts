export const dynamic = "force-dynamic";
// src/app/api/admin/staff/[staffId]/route.ts
// Returns full profile for a single staff member: CV, sample, job history, earnings, withdrawals

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { staffId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.MAIN_ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { staffId } = params;

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      isApproved: true, isSuspended: true, suspendReason: true,
      cvFileUrl: true, sampleFileUrl: true,
      bankName: true, accountNumber: true, accountName: true,
      createdAt: true, approvedAt: true,
    },
  });

  if (!staff) return NextResponse.json({ error: "Staff not found." }, { status: 404 });

  // Job history (chapters assigned to this staff — writer/analyst)
  const chapters = await prisma.orderChapter.findMany({
    where:   { assignedToId: staffId },
    include: { order: { select: { topic: true, degreeGroup: true, serviceType: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // QC-specific: checks and corrections routed to this QC
  const qcChapters = staff.role === "QC" ? await prisma.orderChapter.findMany({
    where:   { routedToQcId: staffId },
    include: { order: { select: { topic: true, degreeGroup: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  }) : [];

  // QC corrections history
  const qcCorrectionsHistory = staff.role === "QC" ? await prisma.$queryRawUnsafe<any[]>(`
    SELECT ch.id, ch."studentRequest", ch."resolvedAt", ch."fileAfterUrl",
           oc."chapterLabel", o.topic
    FROM "CorrectionHistory" ch
    JOIN "OrderChapter" oc ON oc.id = ch."orderChapterId"
    JOIN "Order" o ON o.id = oc."orderId"
    WHERE ch."resolvedById" = $1
    ORDER BY ch."resolvedAt" DESC
    LIMIT 50
  `, staffId) : [];

  // Earnings summary
  const earnings = await prisma.earning.findMany({ where: { userId: staffId } });
  const pendingKobo   = earnings.filter(e => e.status === "PENDING").reduce((s,e) => s + e.amountKobo, 0);
  const availableKobo = earnings.filter(e => e.status === "AVAILABLE").reduce((s,e) => s + e.amountKobo, 0);
  const withdrawnKobo = earnings.filter(e => e.status === "WITHDRAWN").reduce((s,e) => s + e.amountKobo, 0);
  const totalKobo     = earnings.reduce((s,e) => s + e.amountKobo, 0);

  // Withdrawal history
  const withdrawals = await prisma.withdrawal.findMany({
    where:   { userId: staffId },
    orderBy: { requestedAt: "desc" },
    take: 50,
  });

  // Job status counts
  const statusCounts: Record<string, number> = {};
  chapters.forEach(ch => { statusCounts[ch.status] = (statusCounts[ch.status]||0) + 1; });

  // QC workload counts
  const qcActiveChecks       = qcChapters.filter(ch => ch.status === "QC_IN_PROGRESS" && !ch.correctionNotes).length;
  const qcActiveCorrections  = qcChapters.filter(ch => ch.status === "QC_IN_PROGRESS" && ch.correctionNotes).length;
  const qcClearedChecks      = qcChapters.filter(ch => ["QC_DONE","QC_CLEARED","DELIVERED"].includes(ch.status) && !ch.correctionNotes).length;
  const qcSentCorrections    = qcCorrectionsHistory.length;

  return NextResponse.json({
    success: true,
    data: {
      staff,
      jobHistory: chapters.map(ch => ({
        id:            ch.id,
        chapterLabel:  ch.chapterLabel,
        chapterNumber: ch.chapterNumber,
        status:        ch.status,
        topic:         ch.order.topic,
        degreeGroup:   ch.order.degreeGroup,
        serviceType:   ch.order.serviceType,
        orderCreatedAt:ch.order.createdAt,
        startedAt:     (ch as any).startedAt,
        submittedAt:   ch.submittedAt,
        deliveredAt:   ch.deliveredAt,
      })),
      // QC-specific
      qcHistory: qcChapters.map(ch => ({
        id:           ch.id,
        chapterLabel: ch.chapterLabel,
        status:       ch.status,
        topic:        ch.order.topic,
        degreeGroup:  ch.order.degreeGroup,
        isCorrection: !!ch.correctionNotes,
        clearedAt:    (ch as any).qcClearedAt,
        startedAt:    (ch as any).qcStartedAt,
      })),
      qcCorrectionsHistory: qcCorrectionsHistory.map((r:any) => ({
        id:             r.id,
        chapterLabel:   r.chapterLabel,
        topic:          r.topic,
        studentRequest: r.studentRequest,
        resolvedAt:     r.resolvedAt,
        fileAfterUrl:   r.fileAfterUrl,
      })),
      qcWorkload: { qcActiveChecks, qcActiveCorrections, qcClearedChecks, qcSentCorrections },
      statusCounts,
      earningsSummary: { pendingKobo, availableKobo, withdrawnKobo, totalKobo },
      withdrawals: withdrawals.map(w => ({
        id: w.id, amountKobo: w.amountKobo, status: w.status,
        bankName: w.bankName, accountNumber: w.accountNumber,
        requestedAt: w.requestedAt, processedAt: w.processedAt,
      })),
    },
  });
}
