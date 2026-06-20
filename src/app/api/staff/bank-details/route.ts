export const dynamic = "force-dynamic";
// src/app/api/staff/bank-details/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { bankName: true, accountNumber: true, accountName: true, bankCode: true } as any,
  });

  return NextResponse.json({ success: true, data: user });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bankName, bankCode, accountNumber, accountName } = await req.json();

  if (!bankName || !accountNumber || !accountName) {
    return NextResponse.json({ error: "All bank details are required." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { bankName, accountNumber, accountName, bankCode } as any,
  });

  return NextResponse.json({ success: true, message: "Bank details saved." });
}
