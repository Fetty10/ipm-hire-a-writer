export const dynamic = "force-dynamic";
// TEMPORARY — src/app/api/debug/last-payment/route.ts
// Shows the last Paystack transaction to check what metadata was sent
// DELETE after debugging

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("ref");

  if (!reference) {
    // List last 5 transactions
    const res = await fetch("https://api.paystack.co/transaction?perPage=5&page=1", {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await res.json();
    return NextResponse.json(data);
  }

  // Verify specific transaction
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
