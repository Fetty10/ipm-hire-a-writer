export const dynamic = "force-dynamic";
// src/app/api/download/guideline/route.ts
// Proxies a guideline/supervisor-notes/corrections file download with a clean filename

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url   = searchParams.get("url");
  const label = searchParams.get("label") || "Guideline File";

  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  // Only allow proxying our own Cloudinary URLs
  if (!url.includes("cloudinary.com")) {
    return NextResponse.json({ error: "Invalid file source." }, { status: 400 });
  }

  const fileRes = await fetch(url);
  if (!fileRes.ok) return NextResponse.json({ error: "Could not retrieve file." }, { status: 502 });

  const arrayBuffer = await fileRes.arrayBuffer();

  // Determine extension from the URL itself
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "docx";

  const mimeMap: Record<string,string> = {
    pdf:  "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc:  "application/msword",
    jpg:  "image/jpeg", jpeg: "image/jpeg",
    png:  "image/png",
    gif:  "image/gif",
    webp: "image/webp",
    mp3:  "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", ogg: "audio/ogg", aac: "audio/aac", webm: "audio/webm",
  };

  const cleanLabel = label.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const downloadName = `${cleanLabel}.${ext}`.slice(0, 200);

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type":        mimeMap[ext] || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${downloadName.replace(/"/g,"")}"`,
    },
  });
}
