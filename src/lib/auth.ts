// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const STAFF_ROLES = [Role.WRITER, Role.ANALYST, Role.QC, Role.SUB_ADMIN, Role.MAIN_ADMIN];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error:  "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
        portal:   { label: "Portal",   type: "text" }, // "student" | "staff"
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const portal = credentials.portal || "student"; // default to student

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) return null;

        const isStaff = STAFF_ROLES.includes(user.role);

        // ── Portal enforcement ─────────────────────────────────
        if (portal === "student" && isStaff) {
          throw new Error("WRONG_PORTAL_USE_STAFF_LOGIN");
        }
        if (portal === "staff" && !isStaff) {
          throw new Error("WRONG_PORTAL_USE_STUDENT_LOGIN");
        }

        // ── Staff checks ───────────────────────────────────────
        if (isStaff) {
          if (!user.isApproved) throw new Error("ACCOUNT_PENDING_APPROVAL");
          if (user.isSuspended)  throw new Error("ACCOUNT_SUSPENDED");
        }

        return {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id   as string;
        session.user.role = token.role as Role;

        // Real-time check — kick out suspended or deleted admins immediately
        if ([Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(token.role as Role)) {
          try {
            const user = await prisma.user.findUnique({
              where:  { id: token.id as string },
              select: { isApproved:true, isSuspended:true },
            });
            if (!user || !user.isApproved || user.isSuspended) {
              return { ...session, user: { ...session.user, id: "", role: "" as any } };
            }
          } catch (e) { console.error("[SESSION CHECK]", e); }
        }
      }
      return session;
    },
  },

  events: {
    async signIn({ user }) {
      try {
        const u = user as any;
        if ([Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(u.role)) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "SessionLog" (id, "userId", event, "createdAt")
            VALUES (gen_random_uuid()::text, $1, $2, NOW())
          `, u.id, "LOGIN");
        }
      } catch (e) { console.error("[SESSION LOG]", e); }
    },
    async signOut({ token }) {
      try {
        const t = token as any;
        if (t?.id && [Role.MAIN_ADMIN, Role.SUB_ADMIN].includes(t.role)) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "SessionLog" (id, "userId", event, "createdAt")
            VALUES (gen_random_uuid()::text, $1, $2, NOW())
          `, t.id, "LOGOUT");
        }
      } catch (e) { console.error("[SESSION LOG]", e); }
    },
  },
};
