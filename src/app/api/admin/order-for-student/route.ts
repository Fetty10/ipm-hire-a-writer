export const dynamic = "force-dynamic";
// src/app/api/admin/order-for-student/route.ts
// Admin places an order on behalf of an existing student

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    studentId, topic, department, degreeGroup,
    planId, serviceType, selectedChapters,
    specialInstructions, guidelineFileUrl, paymentMethod,
    writerId, analystId,
  } = body;

  if (!studentId || !topic?.trim() || !degreeGroup || !paymentMethod) {
    return NextResponse.json({ error: "studentId, topic, degreeGroup and paymentMethod are required." }, { status: 400 });
  }

  const isProjectService = serviceType === "HIRE_WRITER" || !serviceType;
  if (isProjectService && !planId) {
    return NextResponse.json({ error: "Plan is required for project orders." }, { status: 400 });
  }

  // Verify student exists
  const student = await prisma.user.findUnique({
    where:  { id: studentId },
    select: { id:true, name:true, email:true, role:true },
  });
  if (!student || student.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  // Resolve plan + amount
  let plan: any = null;
  let amountKobo = 0;

  if (isProjectService && planId) {
    const plans = await prisma.$queryRaw<any[]>`
      SELECT id, "planName", "pricingType", "priceKobo"::integer, "includesPlagiarismCheck", "isActive"
      FROM "Plan" WHERE id = ${planId} LIMIT 1
    `;
    plan = plans[0];
    if (!plan || !plan.isActive) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    amountKobo = plan.priceKobo;
    const chapters = selectedChapters ? selectedChapters.split(",").filter(Boolean) : [];
    if (plan.pricingType === "PER_CHAPTER" && chapters.length > 0) {
      amountKobo = plan.priceKobo * chapters.length;
    }
  } else {
    // Other services — lookup from OtherService
    plan = await prisma.plan.findFirst({ orderBy: { updatedAt: "asc" } });
    const svcValueMap: Record<string,string> = {
      PROPOSAL_SEMINAR:"seminar", JOURNAL_WRITING:"journal",
      JOURNAL_SOURCING:"journal_sourcing", TOPIC_SUGGESTION:"topic",
      ASSIGNMENT:"assignment", POWERPOINT:"power_point",
    };
    const svcValue = svcValueMap[serviceType] || serviceType?.toLowerCase();
    const svc = await (prisma as any).otherService.findFirst({ where: { value: svcValue, isActive: true } });
    const degKey: Record<string,string> = { OND_HND_NCE:"OND", BSC_BED_BA:"BSC", PGD_MSC_PHD:"PGD", PHD:"PHD" };
    const dk = degKey[degreeGroup] || "BSC";
    amountKobo = svc?.[`price${dk}`] || 0;
  }

  if (paymentMethod === "BANK_TRANSFER") {
    const reference = `IPM-ADMIN-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
    const order = await prisma.order.create({
      data: {
        clientId:              student.id,
        planId:                plan?.id,
        topic:                 topic.trim(),
        department:            department?.trim() || "",
        degreeGroup,
        serviceType:           serviceType as any,
        specialInstructions:   specialInstructions || null,
        guidelineFileUrl:      guidelineFileUrl || null,
        selectedChapters:      selectedChapters || null,
        status:                "PENDING_PAYMENT",
        paymentMethod:         "BANK_TRANSFER",
        bankTransferReference: reference,
        amountPaidKobo:        amountKobo,
        requiresPlagiarismCheck: plan?.includesPlagiarismCheck || false,
        requiresAiCheck:       plan?.includesPlagiarismCheck || false,
        preferredWriterId:     writerId || null,
        preferredAnalystId:    analystId || null,
      } as any,
    });

    // Notify admin
    const admins = await prisma.user.findMany({
      where: { role: { in: [Role.MAIN_ADMIN, Role.SUB_ADMIN] } }, select: { id:true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(a => ({
          userId: a.id, orderId: order.id,
          title: "📋 Order Created for Student (Admin)",
          message: `Order "${topic.trim()}" created for ${student.name}. Ref: ${reference}`,
          type: "ACTION_REQUIRED" as const,
        })),
      });
    }

    const bankAccount = await (prisma as any).bankAccount.findFirst();
    return NextResponse.json({
      success: true,
      paymentMethod: "BANK_TRANSFER",
      reference,
      amountNaira: amountKobo / 100,
      bankAccount,
      orderId: order.id,
    });
  }

  // Paystack
  if (paymentMethod === "PAYSTACK") {
    const order = await prisma.order.create({
      data: {
        clientId: student.id, planId: plan?.id, topic: topic.trim(),
        department: department?.trim() || "", degreeGroup,
        serviceType: serviceType as any, specialInstructions: specialInstructions || null,
        guidelineFileUrl: guidelineFileUrl || null, selectedChapters: selectedChapters || null,
        status: "PENDING_PAYMENT", requiresPlagiarismCheck: plan?.includesPlagiarismCheck || false,
        requiresAiCheck: plan?.includesPlagiarismCheck || false,
      } as any,
    });
    const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: student.email, amount: amountKobo, currency: "NGN",
        metadata: { orderId: order.id, studentName: student.name, topic },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/inprogress`,
      }),
    });
    const psData = await psRes.json();
    if (!psData.status) {
      await prisma.order.delete({ where: { id: order.id } });
      return NextResponse.json({ error: "Payment initialization failed." }, { status: 500 });
    }
    return NextResponse.json({ success: true, paymentMethod: "PAYSTACK", paymentUrl: psData.data.authorization_url, orderId: order.id });
  }

  return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });

  } catch (err: any) {
    console.error("[ORDER FOR STUDENT]", err?.message);
    return NextResponse.json({ error: err?.message || "Something went wrong." }, { status: 500 });
  }
}
