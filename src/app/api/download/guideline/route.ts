export const dynamic = "force-dynamic";
// src/app/api/download/guideline/route.ts
// Proxies a guideline/supervisor-notes/corrections file download with a clean filename.
// Handles both public and authenticated Cloudinary files.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const mimeMap: Record<string,string> = {
  pdf:  "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc:  "application/msword",
  xls:  "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt:  "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt:  "text/plain",
  jpg:  "image/jpeg", jpeg: "image/jpeg",
  png:  "image/png",
  gif:  "image/gif",
  webp: "image/webp",
  mp3:  "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav",
  ogg:  "audio/ogg",  aac: "audio/aac", webm: "audio/webm",
  zip:  "application/zip",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url   = searchParams.get("url");
  const label = searchParams.get("label") || "Guideline File";

  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  if (!url.includes("cloudinary.com")) {
    return NextResponse.json({ error: "Invalid file source." }, { status: 400 });
  }

  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "docx";

  // Step 1 — try fetching the URL directly (works for public files)
  let fileRes = await fetch(url);

  // Step 2 — if direct fetch fails (authenticated/restricted file), generate
  // a signed URL using Cloudinary SDK and try again
  if (!fileRes.ok) {
    try {
      // Extract the public_id from the Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud}/{resource_type}/upload/{version}/{folder/filename.ext}
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
      if (match) {
        const publicId = match[1].replace(/\.[^.]+$/, ""); // strip extension
        const signedUrl = cloudinary.url(publicId, {
          resource_type: "raw",
          type:          "authenticated",
          sign_url:      true,
          expires_at:    Math.floor(Date.now() / 1000) + 300, // valid for 5 minutes
        });
        fileRes = await fetch(signedUrl);
      }
    } catch (e) {
      console.error("[GUIDELINE DOWNLOAD] Signed URL generation failed:", e);
    }
  }

  if (!fileRes.ok) {
    return NextResponse.json({ error: "Could not retrieve file." }, { status: 502 });
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  const cleanLabel  = label.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  const downloadName = `${cleanLabel}.${ext}`.slice(0, 200);

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type":        mimeMap[ext] || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${downloadName.replace(/"/g, "")}"`,
    },
  });
}
