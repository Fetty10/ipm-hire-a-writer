// src/app/api/upload/route.ts
// Universal file upload endpoint — writer/analyst/QC/student uploads
// Returns a Cloudinary URL stored in DB by the calling API

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  uploadToCloudinary,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type UploadFolder,
} from "@/lib/upload";
import { Role } from "@prisma/client";

// Map role → allowed folders
const ROLE_FOLDERS: Record<Role, UploadFolder[]> = {
  [Role.CLIENT]:     ["orders/guidelines", "orders/supervisor-notes"],
  [Role.WRITER]:     ["chapters/submitted", "staff/cv", "staff/samples"],
  [Role.ANALYST]:    ["chapters/submitted", "staff/cv", "staff/samples"],
  [Role.QC]:         ["chapters/qc-cleared", "chapters/corrections", "staff/cv", "staff/samples"],
  [Role.SUB_ADMIN]:  ["chapters/delivered"],
  [Role.MAIN_ADMIN]: ["chapters/delivered"],
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const folder   = formData.get("folder") as UploadFolder | null;

  if (!file || !folder) {
    return NextResponse.json({ error: "File and folder are required." }, { status: 400 });
  }

  // ── Validate folder access ────────────────────────────────
  const allowed = ROLE_FOLDERS[session.user.role] || [];
  if (!allowed.includes(folder)) {
    return NextResponse.json(
      { error: "You are not allowed to upload to this folder." },
      { status: 403 }
    );
  }

  // ── Validate MIME type ────────────────────────────────────
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF and Word (.docx) files are allowed." },
      { status: 400 }
    );
  }

  // ── Validate file size ────────────────────────────────────
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File size must not exceed 20MB." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, file.name, folder);

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
