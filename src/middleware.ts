// src/middleware.ts
// Protects all dashboard routes — redirects based on role

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as Role | undefined;

    // ── Route → allowed roles ──────────────────────────
    const routeRoles: Record<string, Role[]> = {
      "/client":    [Role.CLIENT],
      "/writer":    [Role.WRITER],
      "/analyst":   [Role.ANALYST],
      "/qc":        [Role.QC],
      "/admin":     [Role.SUB_ADMIN, Role.MAIN_ADMIN],
    };

    for (const [prefix, allowedRoles] of Object.entries(routeRoles)) {
      if (pathname.startsWith(prefix)) {
        if (!role || !allowedRoles.includes(role)) {
          // Redirect to the correct dashboard for their role
          const dashboardMap: Record<Role, string> = {
            [Role.CLIENT]:     "/client/dashboard",
            [Role.WRITER]:     "/writer/dashboard",
            [Role.ANALYST]:    "/analyst/dashboard",
            [Role.QC]:         "/qc/dashboard",
            [Role.SUB_ADMIN]:  "/admin/dashboard",
            [Role.MAIN_ADMIN]: "/admin/dashboard",
          };

          const destination = role
            ? dashboardMap[role]
            : `/login?callbackUrl=${encodeURIComponent(pathname)}`;

          return NextResponse.redirect(new URL(destination, req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // must be logged in for all protected routes
    },
  }
);

export const config = {
  matcher: [
    "/client/:path*",
    "/writer/:path*",
    "/analyst/:path*",
    "/qc/:path*",
    "/admin/:path*",
  ],
};
