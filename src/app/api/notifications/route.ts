// src/app/api/notifications/route.ts
// GET  — fetch notifications for logged-in user
// PATCH — mark one or all as read

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return NextResponse.json({
    success: true,
    data: { notifications, unreadCount },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notificationId, markAllRead } = await req.json();

  if (markAllRead) {
    await prisma.notification.updateMany({
      where:  { userId: session.user.id, isRead: false },
      data:   { isRead: true },
    });
    return NextResponse.json({ success: true, message: "All notifications marked as read." });
  }

  if (notificationId) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: session.user.id },
      data:  { isRead: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "notificationId or markAllRead required." }, { status: 400 });
}
