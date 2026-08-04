export const dynamic = "force-dynamic";
// src/app/api/admin/find-student/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || ![Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(session.user.role as Role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email required." }, { status: 400 });

  const student = await prisma.user.findUnique({
    where:  { email: email.trim().toLowerCase() },
    select: { id:true, name:true, email:true, phone:true, role:true },
  });

  if (!student || student.role !== Role.CLIENT) {
    return NextResponse.json({ error: "No student account found with that email." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: student });
}
