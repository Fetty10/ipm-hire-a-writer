export const dynamic = "force-dynamic";
// src/app/api/download/route.ts
// Proxies a file download with a custom, student-friendly filename
// e.g. "Chapter 1 STATISTICAL STUDY OF THE EFFECTS....docx"

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function buildFileName(topic: string, chapterLabel: string | null, ext: string): string {
  // Clean the topic — remove underscores, collapse whitespace
  const cleanTopic = topic
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const prefix = chapterLabel ? `${chapterLabel} ` : "";
  const name   = `${prefix}${cleanTopic}`.slice(0, 180); // keep filename reasonable

  return `${name}.${ext}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chapterId = searchParams.get("chapterId");
  if (!chapterId) return NextResponse.json({ error: "chapterId required" }, { status: 400 });

  const chapter = await prisma.orderChapter.findUnique({
    where:   { id: chapterId },
    include: { order: { select: { topic: true, clientId: true, serviceType: true } } },
  });

  if (!chapter) return NextResponse.json({ error: "File not found." }, { status: 404 });

  // Only the order's owner (student) or staff/admin can download
  const isOwner = chapter.order.clientId === session.user.id;
  const isStaff = ["WRITER","ANALYST","QC","SUB_ADMIN","MAIN_ADMIN"].includes(session.user.role);
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rawSourceUrl = chapter.deliveredFileUrl || chapter.qcFileUrl || chapter.submittedFileUrl;
  if (!rawSourceUrl) return NextResponse.json({ error: "No file available." }, { status: 404 });

  // Handle comma-separated multi-file URLs (e.g. journal sourcing)
  // The student downloads page handles multiple files — this route serves the first one
  const sourceUrl = rawSourceUrl.split(",")[0].trim();

  // Fetch the actual file from Cloudinary
  const fileRes = await fetch(sourceUrl);
  if (!fileRes.ok) return NextResponse.json({ error: "Could not retrieve file." }, { status: 502 });

  const arrayBuffer = await fileRes.arrayBuffer();

  // Determine extension from the source URL
  const ext = sourceUrl.split(".").pop()?.split("?")[0]?.toLowerCase() || "docx";

  // For project chapters, prefix with "Chapter N "; for other services, no prefix needed
  const isProjectService = chapter.order.serviceType === "HIRE_WRITER" || !chapter.order.serviceType;
  const chapterLabel = isProjectService ? chapter.chapterLabel : null;

  const downloadName = buildFileName(chapter.order.topic, chapterLabel, ext);
  const asciiName    = downloadName.replace(/[^\x00-\x7F]/g, "_");
  const encodedName  = encodeURIComponent(downloadName);

  const mimeMap: Record<string,string> = {
    pdf:  "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc:  "application/msword",
  };

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type":        mimeMap[ext] || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
    },
  });
}
