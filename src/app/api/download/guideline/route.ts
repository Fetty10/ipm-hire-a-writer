export const dynamic = "force-dynamic";
// src/app/api/download/guideline/route.ts

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
  jpg:  "image/jpeg", jpeg:"image/jpeg",
  png:  "image/png", gif:"image/gif", webp:"image/webp",
  mp3:  "audio/mpeg", m4a:"audio/mp4", wav:"audio/wav",
  ogg:  "audio/ogg", aac:"audio/aac", webm:"audio/webm",
  zip:  "application/zip",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url   = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  if (!url.includes("cloudinary.com")) return NextResponse.json({ error: "Invalid file source." }, { status: 400 });

  // Extract public ID and extension from URL
  const urlPath  = url.split("?")[0];
  const ext      = urlPath.split(".").pop()?.toLowerCase() || "pdf";
  const rawFilename = urlPath.split("/").pop() || "file";
  const nameNoExt   = rawFilename.replace(/\.[^.]+$/, "");
  const nameClean   = nameNoExt.replace(/_\d{13}$/, "").replace(/_/g, " ").trim();
  const downloadName = `${nameClean}.${ext}`;
  const asciiName    = downloadName.replace(/[^\x00-\x7F]/g, "_");
  const encodedName  = encodeURIComponent(downloadName);

  // Extract public ID (with extension for raw files)
  const match = url.match(/\/upload\/(?:s--[^-]+--)?\/?(?:v\d+\/)?(.+)$/);
  if (!match) return NextResponse.json({ error: "Invalid Cloudinary URL." }, { status: 400 });
  const publicIdWithExt = match[1];
  const publicId        = publicIdWithExt.replace(/\.[^.]+$/, "");

  // Try 1: direct fetch (works for public files)
  let fileRes = await fetch(url);

  // Try 2: private_download_url — works regardless of access_mode
  if (!fileRes.ok) {
    try {
      const privateUrl = cloudinary.utils.private_download_url(publicIdWithExt, ext, {
        resource_type: "raw",
        expires_at:    Math.floor(Date.now() / 1000) + 300,
        attachment:    false,
      });
      fileRes = await fetch(privateUrl);
    } catch(e) { console.error("[DOWNLOAD] private_download_url failed:", e); }
  }

  // Try 3: signed URL with upload type
  if (!fileRes.ok) {
    try {
      const signedUrl = cloudinary.url(publicId, {
        resource_type: "raw",
        type:          "upload",
        sign_url:      true,
        expires_at:    Math.floor(Date.now() / 1000) + 300,
      });
      fileRes = await fetch(signedUrl);
    } catch(e) { console.error("[DOWNLOAD] signed upload url failed:", e); }
  }

  // Try 4: signed URL with authenticated type
  if (!fileRes.ok) {
    try {
      const signedUrl = cloudinary.url(publicId, {
        resource_type: "raw",
        type:          "authenticated",
        sign_url:      true,
        expires_at:    Math.floor(Date.now() / 1000) + 300,
      });
      fileRes = await fetch(signedUrl);
    } catch(e) { console.error("[DOWNLOAD] signed authenticated url failed:", e); }
  }

  if (!fileRes.ok) {
    console.error("[DOWNLOAD] All attempts failed for:", url, "status:", fileRes.status);
    return NextResponse.json({ error: "Could not retrieve file." }, { status: 502 });
  }

  const arrayBuffer = await fileRes.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type":        mimeMap[ext] || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
    },
  });
}
