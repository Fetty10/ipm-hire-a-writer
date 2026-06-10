// src/lib/auth.ts
// NextAuth config — supports all 6 roles with credentials provider

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        // Check password
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!passwordMatch) return null;

        // Staff must be approved and not suspended
        const isStaff = [
          Role.WRITER,
          Role.ANALYST,
          Role.QC,
          Role.SUB_ADMIN,
          Role.MAIN_ADMIN,
        ].includes(user.role);

        if (isStaff) {
          if (!user.isApproved) {
            throw new Error("ACCOUNT_PENDING_APPROVAL");
          }
          if (user.isSuspended) {
            throw new Error("ACCOUNT_SUSPENDED");
          }
        }

        return {
          id:   user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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
        session.user.id   = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
};

// ─── Type augmentation ───────────────────────────────
// Extend next-auth types so session.user.role is typed

declare module "next-auth" {
  interface Session {
    user: {
      id:    string;
      name:  string;
      email: string;
      role:  Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:   string;
    role: Role;
  }
}
