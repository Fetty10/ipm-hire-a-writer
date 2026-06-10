# iProjectMaster — Hire a Writer
## Phase 1: Database, Auth & Core Logic

---

## Quick Start (5 steps)

### 1. Create the Next.js project
```bash
npx create-next-app@latest ipm-writer --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd ipm-writer
```

### 2. Install all dependencies
```bash
npm install next-auth @auth/prisma-adapter @prisma/client bcryptjs \
  cloudinary resend react-hot-toast lucide-react clsx tailwind-merge \
  date-fns react-hook-form zod @hookform/resolvers

npm install -D prisma @types/bcryptjs tsx
```

### 3. Copy project files
Drop all files from this package into your project root, maintaining the same folder structure.

### 4. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local and fill in your values:
# - DATABASE_URL (from Railway or local Postgres)
# - NEXTAUTH_SECRET (run: openssl rand -base64 32)
# - PAYSTACK_SECRET_KEY + NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
# - CLOUDINARY credentials
# - RESEND_API_KEY
```

### 5. Set up the database
```bash
# Push schema to database
npx prisma db push

# Seed initial data (plans, pricing, exception departments, main admin)
npm run db:seed

# Optional: open Prisma Studio to browse your database
npm run db:studio
```

### 6. Start development server
```bash
npm run dev
```

---

## Default Admin Credentials
After seeding:
- **Email:** admin@iprojectmaster.com
- **Password:** Admin@IPM2025!
- ⚠️ Change this immediately after first login

---

## File Structure (Phase 1 deliverables)

```
prisma/
  schema.prisma          ← Full database schema (all tables)
  seed.ts                ← Seeds plans, pricing, pay rates, admin

src/
  middleware.ts           ← Route protection for all 6 roles

  lib/
    auth.ts              ← NextAuth config (credentials + JWT)
    prisma.ts            ← Prisma client singleton
    assignment.ts        ← Job assignment engine (core business logic)

  app/
    api/
      auth/
        register/route.ts ← Registration (clients + staff)
        [...nextauth]/    ← NextAuth handler (create this yourself)
      payments/
        webhook/route.ts  ← Paystack webhook → triggers assignment
```

---

## NextAuth Handler (create this file yourself)

```ts
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## Dashboard Routes (Phase 2 onward)

| URL | Role |
|---|---|
| `/client/dashboard` | CLIENT |
| `/writer/dashboard` | WRITER |
| `/analyst/dashboard` | ANALYST |
| `/qc/dashboard` | QC |
| `/admin/dashboard` | SUB_ADMIN, MAIN_ADMIN |

All routes are protected by `src/middleware.ts` — wrong-role access redirects to the correct dashboard.

---

## Paystack Webhook Setup
1. Go to Paystack Dashboard → Settings → Webhooks
2. Add URL: `https://yourdomain.com/api/payments/webhook`
3. When initialising a payment, pass `metadata: { orderId: "..." }` so the webhook knows which order to confirm

---

## Assignment Logic Summary

```
Payment confirmed
       ↓
Is department in ExceptionDepartment table?
       ↓ YES                        ↓ NO
All 5 chapters → Writer      Ch 1,2,5 → Writer
(fewest active jobs)         Ch 3,4   → Analyst
                             (each: fewest active jobs)
       ↓
Chapter 1 requires prelim uploads before writer can submit:
  - Research Objectives
  - Research Questions
  - Hypotheses
  - Scope of Study
       ↓
Writer/Analyst submits chapter
       ↓
Does order have requiresPlagiarismCheck OR requiresAiCheck?
       ↓ YES                     ↓ NO
Route to QC              Send directly to client
(fewest active jobs)     dashboard + email
       ↓
QC uploads cleared file
       ↓
Deliver to client dashboard + email
Earnings unlocked for staff
```

---

## Phase 2 (Next)
- Order placement form (client)
- Paystack payment initialisation
- Order tracker (client dashboard)
- Writer dashboard + file upload

Ready? Tell Claude to begin Phase 2.
