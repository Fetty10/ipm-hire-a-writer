export const dynamic = "force-dynamic";
// src/app/api/admin/upload/route.ts
// Dedicated upload endpoint for admin use — no folder restrictions.
// Used for uploading guideline files on behalf of students.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToCloudinary, MAX_FILE_SIZE_BYTES } from "@/lib/upload";
import { Role } from "@prisma/client";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg", "image/png", "image/webp",
  "application/zip",
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File size must not exceed 20MB." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, file.name, "orders/guidelines", file.type);

    return NextResponse.json({
      success:  true,
      url:      result.url,
      fileName: result.fileName,
    });
  } catch (err: any) {
    console.error("[ADMIN UPLOAD ERROR]", err?.message);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
