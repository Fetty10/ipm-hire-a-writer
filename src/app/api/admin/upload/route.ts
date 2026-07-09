export const dynamic = "force-dynamic";
// src/app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { Role } from "@prisma/client";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const ALLOWED_FOLDERS = ["orders/guidelines", "admin/legacy-files", "chapters/delivered"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const folder   = (formData.get("folder") as string) || "admin/legacy-files";

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "Max 20MB." }, { status: 400 });
    if (!ALLOWED_FOLDERS.includes(folder)) return NextResponse.json({ error: "Invalid folder." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext    = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const name   = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, public_id: `${name}_${Date.now()}.${ext}`, resource_type: "raw", access_mode: "public" },
        (err, res) => err ? reject(err) : resolve(res)
      ).end(buffer);
    });

    return NextResponse.json({ success: true, url: result.secure_url, fileName: file.name });
  } catch (err: any) {
    console.error("[ADMIN UPLOAD]", err?.message);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
