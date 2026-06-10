// src/app/api/admin/settings/route.ts
// GET  — fetch pay rates, plans, departments
// PATCH — update pay rates or plan prices
// POST  — add exception department
// DELETE — remove exception department

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

  const { name } = await req.json();
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

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  await prisma.exceptionDepartment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
