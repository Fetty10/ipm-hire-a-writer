export const dynamic = "force-dynamic";
// src/app/api/admin/students/route.ts
// GET  — list all students with order counts
// DELETE — remove a student and all their data permanently

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

function isAdmin(role: string) {
  return [Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(role as Role);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page   = parseInt(searchParams.get("page") || "1");
  const limit  = 30;

  const where: any = {
    role: Role.CLIENT,
    ...(search ? {
      OR: [
        { name:  { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    } : {}),
  };

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id:        true,
        name:      true,
        email:     true,
        phone:     true,
        createdAt: true,
        _count:    { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data:    students.map(s => ({
      id:         s.id,
      name:       s.name,
      email:      s.email,
      phone:      s.phone,
      createdAt:  s.createdAt,
      orderCount: s._count.orders,
    })),
    total,
    pages: Math.ceil(total / limit),
  });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId required." }, { status: 400 });

  const student = await prisma.user.findUnique({
    where:  { id: studentId },
    select: { id: true, name: true, role: true },
  });

  if (!student || student.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  // Delete in cascade order — respect foreign key constraints
  // 1. Correction history for their chapters
  const chapterIds = (await prisma.orderChapter.findMany({
    where:  { order: { clientId: studentId } },
    select: { id: true },
  })).map(c => c.id);

  if (chapterIds.length > 0) {
    await (prisma as any).correctionHistory.deleteMany({
      where: { orderChapterId: { in: chapterIds } },
    });
  }

  // 2. Pending chapter requests
  await (prisma as any).pendingChapterRequest.deleteMany({
    where: { order: { clientId: studentId } },
  });

  // 3. Order chapters
  await prisma.orderChapter.deleteMany({
    where: { order: { clientId: studentId } },
  });

  // 4. Orders
  await prisma.order.deleteMany({ where: { clientId: studentId } });

  // 5. Notifications
  await prisma.notification.deleteMany({ where: { userId: studentId } });

  // 6. Password reset tokens
  await (prisma as any).passwordResetToken.deleteMany({ where: { userId: studentId } });

  // 7. Finally the student account itself
  await prisma.user.delete({ where: { id: studentId } });

  return NextResponse.json({
    success: true,
    message: `Student "${student.name}" and all their data have been permanently deleted.`,
  });
}
