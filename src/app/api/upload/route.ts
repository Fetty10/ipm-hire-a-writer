export const dynamic = "force-dynamic";
// src/app/api/upload/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  uploadToCloudinary,
  ALLOWED_MIME_TYPES,
  ADMIN_LEGACY_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type UploadFolder,
} from "@/lib/upload";
import { Role } from "@prisma/client";

const PUBLIC_FOLDERS: UploadFolder[] = ["staff/cv", "staff/samples"];

const ROLE_FOLDERS: Record<Role, UploadFolder[]> = {
  [Role.CLIENT]:     ["orders/guidelines", "orders/supervisor-notes", "orders/corrections"],
  [Role.WRITER]:     ["chapters/submitted", "staff/cv", "staff/samples"],
  [Role.ANALYST]:    ["chapters/submitted", "staff/cv", "staff/samples"],
  [Role.QC]:         ["chapters/qc-cleared", "chapters/corrections", "staff/cv", "staff/samples"],
  [Role.SUB_ADMIN]:  ["chapters/delivered", "admin/legacy-files"],
  [Role.MAIN_ADMIN]: ["chapters/delivered", "admin/legacy-files"],
};

// Folders where images and audio are also allowed (corrections evidence)
const RICH_MEDIA_FOLDERS = ["orders/corrections", "orders/supervisor-notes"];
// Admin legacy folder accepts a much broader range of file types
const ADMIN_LEGACY_FOLDER = "admin/legacy-files";

const RICH_MEDIA_MIME_TYPES = [
  // Images
  "image/jpeg", "image/png", "image/gif", "image/webp",
  // Audio / voice notes
  "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg",
  "audio/aac", "audio/webm", "video/webm",
];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const folder   = formData.get("folder") as UploadFolder | null;

  if (!file || !folder) {
    return NextResponse.json({ error: "File and folder are required." }, { status: 400 });
  }

  const isPublicFolder = PUBLIC_FOLDERS.includes(folder);

  if (!isPublicFolder) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const allowed = ROLE_FOLDERS[session.user.role] || [];
    if (!allowed.includes(folder)) {
      return NextResponse.json(
        { error: "You are not allowed to upload to this folder." },
        { status: 403 }
      );
    }
  }

  // Allow images + audio for rich media folders, broader types for admin legacy
  const isRichFolder   = RICH_MEDIA_FOLDERS.includes(folder);
  const isAdminLegacy  = folder === ADMIN_LEGACY_FOLDER;
  const allowedTypes   = isAdminLegacy
    ? ADMIN_LEGACY_MIME_TYPES
    : isRichFolder
      ? [...ALLOWED_MIME_TYPES, ...RICH_MEDIA_MIME_TYPES]
      : ALLOWED_MIME_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: isAdminLegacy
          ? "Allowed: PDF, Word, Excel, PowerPoint, images (JPG/PNG/WebP), text files and ZIP archives."
          : isRichFolder
            ? "Allowed: PDF, Word, images (JPG/PNG/GIF/WebP) and voice notes (MP3/M4A/WAV/OGG)."
            : "Only PDF and Word (.docx) files are allowed." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File size must not exceed 20MB." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, file.name, folder, file.type);

    return NextResponse.json({
      success:  true,
      url:      result.url,
      publicId: result.publicId,
      fileName: result.fileName,
      size:     result.sizeBytes,
    });
  } catch (err) {
    console.error("[UPLOAD ERROR]", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
