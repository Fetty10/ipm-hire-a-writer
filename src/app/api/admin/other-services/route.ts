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

const INTL_CURRENCIES = ["GHS","KES","USD","GBP"] as const;
const DEGREES = ["OND","BSC","PGD","PHD"] as const;

// Build all 16 intl price field names: priceGHSOND, priceGHSBSC, etc.
const INTL_FIELDS = INTL_CURRENCIES.flatMap(c => DEGREES.map(d => `price${c}${d}`));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  if (all) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !adminOnly(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const services = await (prisma as any).otherService.findMany({
    where:   all ? {} : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ success: true, data: services });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { label, value, description, priceOND, priceBSC, pricePGD, pricePHD, sortOrder } = body;

  if (!label?.trim() || !value?.trim()) {
    return NextResponse.json({ error: "Label and value are required." }, { status: 400 });
  }

  const existing = await (prisma as any).otherService.findUnique({
    where: { value: value.trim().toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "A service with this identifier already exists." }, { status: 409 });
  }

  // Build intl price data
  const intlData: any = {};
  for (const field of INTL_FIELDS) {
    intlData[field] = Math.round((body[field] || 0) * 100);
  }

  const service = await (prisma as any).otherService.create({
    data: {
      label:       label.trim(),
      value:       value.trim().toLowerCase().replace(/\s+/g, "_"),
      description: description?.trim() || null,
      priceOND:    Math.round((priceOND || 0) * 100),
      priceBSC:    Math.round((priceBSC || 0) * 100),
      pricePGD:    Math.round((pricePGD || 0) * 100),
      pricePHD:    Math.round((pricePHD || 0) * 100),
      ...intlData,
      sortOrder:      sortOrder || 0,
      writerPayKobo:  Math.round((body.writerPayKobo  || 0) * 100),
      isActive:       true,
    },
  });

  return NextResponse.json({ success: true, data: service, message: "Service added." });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, label, description, priceOND, priceBSC, pricePGD, pricePHD, sortOrder, isActive } = body;
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });

  const data: any = { updatedAt: new Date() };
  if (label       !== undefined) data.label       = label.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (priceOND    !== undefined) data.priceOND    = Math.round(priceOND * 100);
  if (priceBSC    !== undefined) data.priceBSC    = Math.round(priceBSC * 100);
  if (pricePGD    !== undefined) data.pricePGD    = Math.round(pricePGD * 100);
  if (pricePHD    !== undefined) data.pricePHD    = Math.round(pricePHD * 100);
  if (sortOrder       !== undefined) data.sortOrder       = sortOrder;
  if (isActive        !== undefined) data.isActive        = isActive;
  if (body.writerPayKobo  !== undefined) data.writerPayKobo  = Math.round(body.writerPayKobo  * 100);

  // Save all intl price fields
  for (const field of INTL_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = Math.round((body[field] || 0) * 100);
    }
  }

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
