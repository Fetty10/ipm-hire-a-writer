export const dynamic = "force-dynamic";
// src/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

function adminOnly(role: Role) {
  return [Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(role);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";

  const [payRates, plans, departments] = await Promise.all([
    type === "departments" ? [] : prisma.payRate.findMany({ orderBy: [{ role: "asc" }, { degreeGroup: "asc" }] }),
    type === "departments" ? [] : prisma.plan.findMany({ orderBy: [{ degreeGroup: "asc" }, { planName: "asc" }] }),
    type !== "payrates"    ? prisma.exceptionDepartment.findMany({ orderBy: { name: "asc" } }) : [],
  ]);

  return NextResponse.json({ success: true, data: { payRates, plans, departments } });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id, amountKobo, priceKobo } = await req.json();

  if (type === "payrate" && id && amountKobo !== undefined) {
    await prisma.payRate.update({
      where: { id }, data: { amountKobo, updatedById: session.user.id },
    });
    return NextResponse.json({ success: true, message: "Pay rate updated." });
  }

  if (type === "plan" && id && priceKobo !== undefined) {
    await prisma.plan.update({
      where: { id }, data: { priceKobo, updatedById: session.user.id },
    });
    return NextResponse.json({ success: true, message: "Plan price updated." });
  }

  return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type } = body;

  // ── Add new pay rate ─────────────────────────────────────────
  if (type === "payrate") {
    const { role, degreeGroup, planName, amountKobo } = body;
    if (!role || !degreeGroup || !planName || !amountKobo) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    const existing = await prisma.payRate.findFirst({ where: { role, degreeGroup, planName, chapterNumber: null } });
    if (existing) {
      return NextResponse.json({ error: "A pay rate for this combination already exists. Edit the existing one." }, { status: 409 });
    }
    const rate = await prisma.payRate.create({
      data: { role, degreeGroup, planName, amountKobo, updatedById: session.user.id },
    });
    return NextResponse.json({ success: true, data: rate, message: "Pay rate added." });
  }

  // ── Add new plan ─────────────────────────────────────────────
  if (type === "plan") {
    const { degreeGroup, planName, pricingType, priceKobo, includesCorrections, includesPlagiarismCheck, includesFormat } = body;
    if (!degreeGroup || !planName || !pricingType || !priceKobo) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    const existing = await prisma.plan.findFirst({ where: { degreeGroup, planName } });
    if (existing) {
      return NextResponse.json({ error: "A plan for this combination already exists. Edit the existing one." }, { status: 409 });
    }
    const plan = await prisma.plan.create({
      data: {
        degreeGroup, planName, pricingType, priceKobo,
        includesCorrections:     includesCorrections || false,
        includesPlagiarismCheck: includesPlagiarismCheck || false,
        includesFormat:          includesFormat || false,
        isActive:                true,
        updatedById:             session.user.id,
      },
    });
    return NextResponse.json({ success: true, data: plan, message: "Plan added." });
  }

  // ── Add exception department ─────────────────────────────────
  const { name } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Department name is required." }, { status: 400 });
  const dept = await prisma.exceptionDepartment.create({
    data: { name: name.trim(), createdBy: session.user.id },
  });
  return NextResponse.json({ success: true, data: dept });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, type } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  if (type === "payrate") {
    await prisma.payRate.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Pay rate deleted." });
  }

  // Default: delete exception department
  await prisma.exceptionDepartment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
