export const dynamic = "force-dynamic";
// src/app/api/banks/route.ts
// Fetches full list of Nigerian banks (including OPay, Kuda, Moniepoint etc.) from Paystack

import { NextResponse } from "next/server";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function GET() {
  try {
    const res  = await fetch("https://api.paystack.co/bank?country=nigeria&use_cursor=false&perPage=100", {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      next: { revalidate: 86400 }, // cache for 24h — bank list rarely changes
    });
    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: "Failed to fetch banks." }, { status: 500 });
    }

    const banks = data.data
      .map((b: any) => ({ name: b.name, code: b.code }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, data: banks });
  } catch (err) {
    return NextResponse.json({ error: "Could not load bank list." }, { status: 500 });
  }
}
