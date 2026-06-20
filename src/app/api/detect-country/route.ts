export const dynamic = "force-dynamic";
// src/app/api/detect-country/route.ts
import { NextRequest, NextResponse } from "next/server";

const COUNTRY_CURRENCY: Record<string, { currency: string; symbol: string; flw: string }> = {
  NG: { currency: "NGN", symbol: "₦",   flw: "NGN" },
  GH: { currency: "GHS", symbol: "GH₵", flw: "GHS" },
  KE: { currency: "KES", symbol: "KSh", flw: "KES" },
  GB: { currency: "GBP", symbol: "£",   flw: "GBP" },
  US: { currency: "USD", symbol: "$",   flw: "USD" },
  CA: { currency: "USD", symbol: "$",   flw: "USD" },
  AU: { currency: "USD", symbol: "$",   flw: "USD" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const override = searchParams.get("country");

  // Testing override — e.g. ?country=NG forces Nigeria regardless of real IP
  const country = override || req.headers.get("x-vercel-ip-country") || "NG";
  const info    = COUNTRY_CURRENCY[country] || { currency: "USD", symbol: "$", flw: "USD" };

  return NextResponse.json({
    country,
    currency:  info.currency,
    symbol:    info.symbol,
    flw:       info.flw,
    isNigeria: country === "NG",
  });
}
