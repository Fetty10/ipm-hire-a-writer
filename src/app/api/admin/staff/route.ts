// src/app/api/admin/staff/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { sendAccountApprovedEmail, sendAccountDeclinedEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role   = searchParams.get("role") as Role | "all" | null;
  const filter = searchParams.get("filter") || "all"; // all | pending | active | suspended
  const search = searchParams.get("search") || "";

  const staffRoles = [Role.WRITER, Role.ANALYST, Role.QC];
  const where: any = {
    role: role && role !== "all" ? role : { in: staffRoles },
  };
  if (filter === "pending")   { where.isApproved = false; }
  if (filter === "active")    { where.isApproved = true; where.isSuspended = false; }
  if (filter === "suspended") { where.isSuspended = true; }
  if (filter === "approved")  { where.isApproved = true; } // all approved staff including suspended
  if (search) {
    where.OR = [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const staff = await prisma.user.findMany({
    where, orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      isApproved: true, isSuspended: true, suspendReason: true,
      createdAt: true, approvedAt: true,
      cvFileUrl: true, sampleFileUrl: true,
    },
  });

  // Add active job counts
  const enriched = await Promise.all(staff.map(async (s) => {
    const [activeJobs, totalEarned] = await Promise.all([
      prisma.orderChapter.count({
        where: { assignedToId: s.id, status: { in: ["NOT_STARTED","IN_PROGRESS","PRELIM_SUBMITTED"] } },
      }),
      prisma.earning.aggregate({
        where: { userId: s.id },
        _sum: { amountKobo: true },
      }),
    ]);
    return { ...s, activeJobs, totalEarnedNaira: (totalEarned._sum.amountKobo || 0) / 100 };
  }));

  return NextResponse.json({ success: true, data: enriched });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.MAIN_ADMIN) {
    return NextResponse.json({ error: "Only Main Admin can manage staff." }, { status: 403 });
  }

  const { staffId, action, reason } = await req.json();
  if (!staffId || !action) {
    return NextResponse.json({ error: "staffId and action are required." }, { status: 400 });
  }

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    select: { name: true, email: true, role: true },
  });
  if (!staff) return NextResponse.json({ error: "Staff not found." }, { status: 404 });

  const actions: Record<string, () => Promise<any>> = {
    approve: async () => {
      await prisma.user.update({
        where: { id: staffId },
        data: { isApproved: true, approvedAt: new Date(), approvedById: session.user.id },
      });
      await sendAccountApprovedEmail({ to: staff.email, name: staff.name, role: staff.role });
      await prisma.notification.create({
        data: {
          userId: staffId, title: "Account Approved ✅",
          message: "Your account has been approved. You can now log in and start accepting jobs.",
          type: "SUCCESS",
        },
      });
    },
    decline: async () => {
      await prisma.user.delete({ where: { id: staffId } });
      await sendAccountDeclinedEmail({ to: staff.email, name: staff.name, role: staff.role, reason });
    },
    suspend: async () => {
      await prisma.user.update({
        where: { id: staffId },
        data: { isSuspended: true, suspendReason: reason || null },
      });
      await prisma.notification.create({
        data: {
          userId: staffId, title: "Account Suspended",
          message: `Your account has been suspended.${reason ? ` Reason: ${reason}` : ""} Contact admin for more information.`,
          type: "ALERT",
        },
      });
    },
    unsuspend: async () => {
      await prisma.user.update({
        where: { id: staffId },
        data: { isSuspended: false, suspendReason: null },
      });
      await prisma.notification.create({
        data: {
          userId: staffId, title: "Account Reinstated",
          message: "Your account suspension has been lifted. You can now accept jobs again.",
          type: "SUCCESS",
        },
      });
    },
  };

  const fn = actions[action];
  if (!fn) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  await fn();

  return NextResponse.json({ success: true, message: `Staff ${action}d successfully.` });
}
