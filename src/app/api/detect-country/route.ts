export const dynamic = "force-dynamic";
// src/app/api/detect-country/route.ts
// Detects visitor country from IP and returns currency info

import { NextRequest, NextResponse } from "next/server";

const COUNTRY_CURRENCY: Record<string, { currency: string; symbol: string; flw: string }> = {
  NG: { currency: "NGN", symbol: "₦",  flw: "NGN" },
  GH: { currency: "GHS", symbol: "GH₵",flw: "GHS" },
  KE: { currency: "KES", symbol: "KSh", flw: "KES" },
  US: { currency: "USD", symbol: "$",   flw: "USD" },
  GB: { currency: "GBP", symbol: "£",   flw: "GBP" },
  CA: { currency: "USD", symbol: "$",   flw: "USD" },
  AU: { currency: "USD", symbol: "$",   flw: "USD" },
  // Default all others to USD
};

export async function GET(req: NextRequest) {
  try {
    // Get IP from headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "8.8.8.8";

    // Skip detection for localhost/private IPs
    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168") || ip.startsWith("10.");
    if (isLocal) {
      return NextResponse.json({ country: "NG", currency: "NGN", symbol: "₦", flw: "NGN", isNigeria: true });
    }

    // Use ipapi.co free tier (1000 req/day)
    const res    = await fetch(`https://ipapi.co/${ip}/json/`, { next: { revalidate: 3600 } });
    const data   = await res.json();
    const code   = data.country_code || "NG";
    const info   = COUNTRY_CURRENCY[code] || { currency: "USD", symbol: "$", flw: "USD" };

    return NextResponse.json({
      country:   code,
      countryName: data.country_name || code,
      currency:  info.currency,
      symbol:    info.symbol,
      flw:       info.flw,
      isNigeria: code === "NG",
    });
  } catch {
    // Default to Nigeria on error
    return NextResponse.json({ country: "NG", currency: "NGN", symbol: "₦", flw: "NGN", isNigeria: true });
  }
}
