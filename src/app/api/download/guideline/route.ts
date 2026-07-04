export const dynamic = "force-dynamic";
// src/app/api/download/guideline/route.ts
// Proxies guideline/supervisor-notes/corrections file downloads with the
// original filename preserved — no custom labelling needed.

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
  png:  "image/png", gif: "image/gif", webp: "image/webp",
  mp3:  "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav",
  ogg:  "audio/ogg", aac: "audio/aac", webm: "audio/webm",
  zip:  "application/zip",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  if (!url.includes("cloudinary.com")) {
    return NextResponse.json({ error: "Invalid file source." }, { status: 400 });
  }

  // Extract original filename from Cloudinary URL
  // URL format: .../upload/v123456/folder/Original_Filename_1234567890.pdf
  // We strip the timestamp suffix added during upload to restore original name
  const urlPath     = url.split("?")[0];
  const ext         = urlPath.split(".").pop()?.toLowerCase() || "pdf";
  const rawFilename = urlPath.split("/").pop() || "file";
  // Strip the _TIMESTAMP suffix we add during upload (e.g. "My_Doc_1783077117353.pdf" → "My Doc.pdf")
  const nameNoExt   = rawFilename.replace(/\.[^.]+$/, "");
  const nameClean   = nameNoExt.replace(/_\d{13}$/, "").replace(/_/g, " ").trim();
  const downloadName = `${nameClean}.${ext}`;

  // Try direct fetch first (works for public files)
  let fileRes = await fetch(url);

  // Fallback: generate signed URL for authenticated files (uploaded before our public mode fix)
  if (!fileRes.ok) {
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
      if (match) {
        const publicId  = match[1].replace(/\.[^.]+$/, "");
        const expiresAt = Math.floor(Date.now() / 1000) + 300;
        fileRes = await fetch(cloudinary.url(publicId, { resource_type:"raw", type:"authenticated", sign_url:true, expires_at:expiresAt }));
        if (!fileRes.ok) {
          fileRes = await fetch(cloudinary.url(publicId, { resource_type:"raw", type:"upload", sign_url:true, expires_at:expiresAt }));
        }
      }
    } catch (e) { console.error("[GUIDELINE DOWNLOAD] Signed URL failed:", e); }
  }

  if (!fileRes.ok) return NextResponse.json({ error: "Could not retrieve file." }, { status: 502 });

  const arrayBuffer = await fileRes.arrayBuffer();
  // RFC 5987 encoding handles any Unicode characters safely
  const asciiName   = downloadName.replace(/[^\x00-\x7F]/g, "_");
  const encodedName = encodeURIComponent(downloadName);

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type":        mimeMap[ext] || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
    },
  });
}
