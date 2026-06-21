export const dynamic = "force-dynamic";
// src/app/api/admin/pending-chapter-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { assignSpecificChapters } from "@/lib/assignment";

// GET: list pending/confirmed add-chapter requests
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING_PAYMENT";

  const requests = await (prisma as any).pendingChapterRequest.findMany({
    where:   { status },
    orderBy: { createdAt: "desc" },
  });

  // Attach order + student info
  const enriched = await Promise.all(requests.map(async (r: any) => {
    const order = await prisma.order.findUnique({
      where:  { id: r.orderId },
      select: { topic: true, degreeGroup: true, client: { select: { name: true, phone: true } } },
    });
    return { ...r, order };
  }));

  return NextResponse.json({ success: true, data: enriched });
}

// PATCH: confirm payment and auto-assign chapters
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await req.json();
  if (!requestId) return NextResponse.json({ error: "requestId required." }, { status: 400 });

  const request = await (prisma as any).pendingChapterRequest.findUnique({ where: { id: requestId } });
  if (!request) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  if (request.status === "CONFIRMED") {
    return NextResponse.json({ error: "Already confirmed." }, { status: 409 });
  }

  const chapterNumbers = request.chapterNumbers.split(",").map(Number);

  // Safety check: ensure none of these chapters were already created on the order
  // (e.g. if another request for the same chapters was confirmed first)
  const order = await prisma.order.findUnique({
    where:   { id: request.orderId },
    include: { chapters: { select: { chapterNumber: true } } },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const existingNums = order.chapters.map(ch => ch.chapterNumber);
  const alreadyExists = chapterNumbers.filter((n: number) => existingNums.includes(n));
  if (alreadyExists.length > 0) {
    // Auto-reject this stale/duplicate request instead of double-assigning
    await (prisma as any).pendingChapterRequest.update({
      where: { id: requestId },
      data:  { status: "CONFIRMED", confirmedAt: new Date(), confirmedById: session.user.id },
    });
    return NextResponse.json({
      error: `Chapter(s) ${alreadyExists.join(", ")} were already assigned from another confirmed request. This request has been closed without re-assigning — please verify with the student whether a refund is needed.`,
    }, { status: 409 });
  }

  // Update guideline if provided
  if (request.guidelineFileUrl) {
    const existing = order.guidelineFileUrl;
    await prisma.order.update({
      where: { id: request.orderId },
      data:  { guidelineFileUrl: existing ? `${existing},${request.guidelineFileUrl}` : request.guidelineFileUrl },
    });
  }

  // Mark confirmed
  await (prisma as any).pendingChapterRequest.update({
    where: { id: requestId },
    data:  { status: "CONFIRMED", confirmedAt: new Date(), confirmedById: session.user.id },
  });

  // Auto-assign the chapters
  await assignSpecificChapters(request.orderId, chapterNumbers);

  return NextResponse.json({ success: true, message: "Payment confirmed. Chapters assigned." });
}

// DELETE: reject/cancel a pending request (e.g. duplicate from student re-clicking)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = await req.json();
  if (!requestId) return NextResponse.json({ error: "requestId required." }, { status: 400 });

  const request = await (prisma as any).pendingChapterRequest.findUnique({ where: { id: requestId } });
  if (!request) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  await (prisma as any).pendingChapterRequest.delete({ where: { id: requestId } });

  return NextResponse.json({ success: true, message: "Request rejected/removed." });
}
