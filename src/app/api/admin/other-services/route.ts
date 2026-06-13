export const dynamic = "force-dynamic";
// src/app/api/admin/other-services/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

function adminOnly(role: Role) {
  return [Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(role);
}

// Public GET — used by hire page
export async function GET() {
  const services = await (prisma as any).otherService.findMany({
    where:   { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ success: true, data: services });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, value, description, priceOND, priceBSC, pricePGD, sortOrder } = await req.json();

  if (!label?.trim() || !value?.trim()) {
    return NextResponse.json({ error: "Label and value are required." }, { status: 400 });
  }

  // Check unique value
  const existing = await (prisma as any).otherService.findUnique({ where: { value: value.trim().toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "A service with this identifier already exists." }, { status: 409 });
  }

  const service = await (prisma as any).otherService.create({
    data: {
      label:       label.trim(),
      value:       value.trim().toLowerCase().replace(/\s+/g, "_"),
      description: description?.trim() || null,
      priceOND:    Math.round((priceOND || 0) * 100),
      priceBSC:    Math.round((priceBSC || 0) * 100),
      pricePGD:    Math.round((pricePGD || 0) * 100),
      sortOrder:   sortOrder || 0,
      isActive:    true,
    },
  });

  return NextResponse.json({ success: true, data: service, message: "Service added." });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, label, description, priceOND, priceBSC, pricePGD, sortOrder, isActive } = await req.json();
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });

  const data: any = { updatedAt: new Date() };
  if (label       !== undefined) data.label       = label.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (priceOND    !== undefined) data.priceOND    = Math.round(priceOND * 100);
  if (priceBSC    !== undefined) data.priceBSC    = Math.round(priceBSC * 100);
  if (pricePGD    !== undefined) data.pricePGD    = Math.round(pricePGD * 100);
  if (sortOrder   !== undefined) data.sortOrder   = sortOrder;
  if (isActive    !== undefined) data.isActive    = isActive;

  await (prisma as any).otherService.update({ where: { id }, data });
  return NextResponse.json({ success: true, message: "Service updated." });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });

  await (prisma as any).otherService.delete({ where: { id } });
  return NextResponse.json({ success: true, message: "Service deleted." });
}
