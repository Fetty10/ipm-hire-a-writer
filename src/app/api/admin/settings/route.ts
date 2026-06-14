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
    type === "departments" ? [] : prisma.payRate.findMany({ orderBy: [{ role:"asc" }, { degreeGroup:"asc" }] }),
    type === "departments" ? [] : prisma.plan.findMany({ orderBy: [{ degreeGroup:"asc" }, { planName:"asc" }] }),
    type !== "payrates"    ? prisma.exceptionDepartment.findMany({ orderBy: { name:"asc" } }) : [],
  ]);

  return NextResponse.json({ success:true, data:{ payRates, plans, departments } });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, id } = body;

  // ── Update pay rate ──────────────────────────────────────────
  if (type === "payrate") {
    if (!id || body.amountKobo === undefined) {
      return NextResponse.json({ error: "id and amountKobo required." }, { status:400 });
    }
    await prisma.payRate.update({
      where: { id },
      data:  { amountKobo: body.amountKobo, updatedById: session.user.id },
    });
    return NextResponse.json({ success:true, message:"Pay rate updated." });
  }

  // ── Update plan — full edit support ──────────────────────────
  if (type === "plan") {
    if (!id) return NextResponse.json({ error: "id required." }, { status:400 });
    const data: any = { updatedById: session.user.id };
    if (body.priceKobo               !== undefined) data.priceKobo               = body.priceKobo;
    if (body.pricingType             !== undefined) data.pricingType             = body.pricingType;
    if (body.priceGHS                !== undefined) data.priceGHS                = body.priceGHS;
    if (body.priceKES                !== undefined) data.priceKES                = body.priceKES;
    if (body.priceUSD                !== undefined) data.priceUSD                = body.priceUSD;
    if (body.priceGBP                !== undefined) data.priceGBP                = body.priceGBP;
    if (body.includesCorrections     !== undefined) data.includesCorrections     = body.includesCorrections;
    if (body.includesPlagiarismCheck !== undefined) data.includesPlagiarismCheck = body.includesPlagiarismCheck;
    if (body.includesFormat          !== undefined) data.includesFormat          = body.includesFormat;
    if (body.isActive                !== undefined) data.isActive                = body.isActive;
    await prisma.plan.update({ where: { id }, data });
    return NextResponse.json({ success:true, message:"Plan updated." });
  }

  return NextResponse.json({ error:"Invalid update payload." }, { status:400 });
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
      return NextResponse.json({ error:"All fields are required." }, { status:400 });
    }
    const existing = await prisma.payRate.findFirst({ where:{ role, degreeGroup, planName, chapterNumber:null } });
    if (existing) {
      return NextResponse.json({ error:"A pay rate for this combination already exists. Edit the existing one." }, { status:409 });
    }
    const rate = await prisma.payRate.create({
      data: { role, degreeGroup, planName, amountKobo, updatedById:session.user.id },
    });
    return NextResponse.json({ success:true, data:rate, message:"Pay rate added." });
  }

  // ── Add new plan ─────────────────────────────────────────────
  if (type === "plan") {
    const { degreeGroup, planName, pricingType, priceKobo, includesCorrections, includesPlagiarismCheck, includesFormat } = body;
    if (!degreeGroup || !planName || !pricingType || !priceKobo) {
      return NextResponse.json({ error:"All fields are required." }, { status:400 });
    }
    const existing = await prisma.plan.findFirst({ where:{ degreeGroup, planName } });
    if (existing) {
      return NextResponse.json({ error:"A plan for this combination already exists. Edit the existing one." }, { status:409 });
    }
    const { priceGHS, priceKES, priceUSD, priceGBP } = body;
    const plan = await prisma.plan.create({
      data: {
        degreeGroup, planName, pricingType, priceKobo,
        priceGHS:                priceGHS || null,
        priceKES:                priceKES || null,
        priceUSD:                priceUSD || null,
        priceGBP:                priceGBP || null,
        includesCorrections:     includesCorrections     || false,
        includesPlagiarismCheck: includesPlagiarismCheck || false,
        includesFormat:          includesFormat          || false,
        isActive:                true,
        updatedById:             session.user.id,
      } as any,
    });
    return NextResponse.json({ success:true, data:plan, message:"Plan added." });
  }

  // ── Add exception department ─────────────────────────────────
  const { name } = body;
  if (!name?.trim()) return NextResponse.json({ error:"Department name is required." }, { status:400 });
  const dept = await prisma.exceptionDepartment.create({
    data: { name: name.trim(), createdBy: session.user.id },
  });
  return NextResponse.json({ success:true, data:dept });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !adminOnly(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, type } = await req.json();
  if (!id) return NextResponse.json({ error:"id is required." }, { status:400 });

  if (type === "payrate") {
    await prisma.payRate.delete({ where: { id } });
    return NextResponse.json({ success:true, message:"Pay rate deleted." });
  }

  if (type === "plan") {
    // Check if any orders use this plan
    const inUse = await prisma.order.count({ where: { planId: id } });
    if (inUse > 0) {
      return NextResponse.json({
        error: `This plan is used by ${inUse} order(s). Deactivate it instead of deleting.`,
      }, { status:409 });
    }
    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ success:true, message:"Plan deleted." });
  }

  // Default: delete exception department
  await prisma.exceptionDepartment.delete({ where: { id } });
  return NextResponse.json({ success:true });
}
