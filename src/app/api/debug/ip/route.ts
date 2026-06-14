export const dynamic = "force-dynamic";
// TEMP: src/app/api/debug/ip/route.ts — delete after testing
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const headers: Record<string,string> = {};
  req.headers.forEach((val, key) => { headers[key] = val; });
  
  return NextResponse.json({
    "x-forwarded-for":      req.headers.get("x-forwarded-for"),
    "x-real-ip":            req.headers.get("x-real-ip"),
    "cf-connecting-ip":     req.headers.get("cf-connecting-ip"),
    "x-vercel-forwarded-for": req.headers.get("x-vercel-forwarded-for"),
    "x-vercel-ip-country":  req.headers.get("x-vercel-ip-country"),
    "x-vercel-ip-city":     req.headers.get("x-vercel-ip-city"),
  });
}
