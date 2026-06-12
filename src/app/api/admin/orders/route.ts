export const dynamic = "force-dynamic";
// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["MAIN_ADMIN","SUB_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status  = searchParams.get("status") || "all";
  const search  = searchParams.get("search") || "";
  const orderId = searchParams.get("orderId"); // single order detail

  // ── Single order detail ──────────────────────────────────────
  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { select: { id:true, name:true, email:true, phone:true } },
        plan:   { select: { planName:true, degreeGroup:true, pricingType:true, priceKobo:true } },
        chapters: {
  include: {
    assignedTo: { select: { id:true, name:true, role:true, email:true } },
  },
  orderBy: { chapterNumber: "asc" },
},
          orderBy: { chapterNumber: "asc" },
        },
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: order });
  }

  // ── Order list ───────────────────────────────────────────────
  const where: any = {};
  if (status !== "all") where.status = status as OrderStatus;
  if (search) {
    where.OR = [
      { topic:              { contains: search, mode: "insensitive" } },
      { client: { name:     { contains: search, mode: "insensitive" } } },
      { client: { phone:    { contains: search, mode: "insensitive" } } },
      { client: { email:    { contains: search, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        client:   { select: { name:true, phone:true, email:true } },
        plan:     { select: { planName:true } },
        chapters: {
          include: { assignedTo: { select: { name:true, role:true } } },
          orderBy: { chapterNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: { orders, total } });
}

// ── Admin adjustments ────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["MAIN_ADMIN","SUB_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, orderId, chapterId, staffId, notes } = body;

  // ── Reassign a chapter to a different staff ──
  if (action === "reassign_chapter") {
    if (!chapterId || !staffId) return NextResponse.json({ error: "chapterId and staffId required" }, { status: 400 });
    const staff = await prisma.user.findUnique({ where: { id: staffId }, select: { role:true } });
    if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    await prisma.orderChapter.update({
      where: { id: chapterId },
      data: {
        assignedToId: staffId,
        assigneeRole: staff.role as any,
        status: "NOT_STARTED",
      },
    });
    await prisma.notification.create({
      data: {
        userId:  staffId,
        title:   "Chapter Reassigned to You",
        message: `Admin has reassigned a chapter to you. Please check your Pending Jobs.`,
        type:    "ACTION_REQUIRED",
      },
    });
    return NextResponse.json({ success: true, message: "Chapter reassigned." });
  }

  // ── Add admin note to order ──
  if (action === "add_note") {
    if (!orderId || !notes) return NextResponse.json({ error: "orderId and notes required" }, { status: 400 });
    await prisma.order.update({
      where: { id: orderId },
      data:  { specialInstructions: notes },
    });
    return NextResponse.json({ success: true, message: "Note saved." });
  }

  // ── Mark order as delivered manually ──
  if (action === "mark_delivered") {
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
    await prisma.order.update({
      where: { id: orderId },
      data:  { status: "DELIVERED" },
    });
    return NextResponse.json({ success: true, message: "Order marked as delivered." });
  }

  // ── Cancel order ──
  if (action === "cancel") {
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });
    await prisma.order.update({
      where: { id: orderId },
      data:  { status: "CANCELLED" },
    });
    return NextResponse.json({ success: true, message: "Order cancelled." });
  }

  // ── Reset chapter to NOT_STARTED ──
  if (action === "reset_chapter") {
    if (!chapterId) return NextResponse.json({ error: "chapterId required" }, { status: 400 });
    await prisma.orderChapter.update({
      where: { id: chapterId },
      data:  { status: "NOT_STARTED", submittedAt: null, submittedFileUrl: null },
    });
    return NextResponse.json({ success: true, message: "Chapter reset to pending." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
