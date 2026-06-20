export const dynamic = "force-dynamic";
// src/app/api/banks/resolve/route.ts
// Resolves account number + bank code to account holder name via Paystack

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountNumber, bankCode } = await req.json();

  if (!accountNumber || accountNumber.length !== 10 || !bankCode) {
    return NextResponse.json({ error: "Valid 10-digit account number and bank are required." }, { status: 400 });
  }

  try {
    const res  = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
    );
    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Could not verify account. Check the details and try again." }, { status: 400 });
    }

    return NextResponse.json({
      success:     true,
      accountName: data.data.account_name,
    });
  } catch (err) {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
