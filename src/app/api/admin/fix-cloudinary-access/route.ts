export const dynamic = "force-dynamic";
// src/app/api/admin/fix-cloudinary-access/route.ts
// One-time fix: changes blocked Cloudinary files to public delivery type
// DELETE THIS FILE after running once

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.MAIN_ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all chapters with submitted/delivered files
  const chapters = await prisma.orderChapter.findMany({
    where: {
      OR: [
        { submittedFileUrl: { not: null } },
        { deliveredFileUrl: { not: null } },
        { qcFileUrl: { not: null } },
      ],
    },
    select: { submittedFileUrl:true, deliveredFileUrl:true, qcFileUrl:true },
  });

  const urls = new Set<string>();
  chapters.forEach(ch => {
    [ch.submittedFileUrl, ch.deliveredFileUrl, ch.qcFileUrl].forEach(f => {
      if (f) f.split(",").forEach(u => urls.add(u.trim()));
    });
  });

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const url of urls) {
    try {
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
      if (!match) continue;
      const publicId = match[1].replace(/\.[^.]+$/, "");
      await cloudinary.uploader.explicit(publicId, {
        resource_type: "raw",
        type: "authenticated",
        access_mode: "public",
      });
      results.success++;
    } catch (e: any) {
      results.failed++;
      results.errors.push(e.message);
    }
  }

  return NextResponse.json({ success: true, ...results, total: urls.size });
}
