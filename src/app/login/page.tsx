"use client";
// src/app/login/page.tsx

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button, Input, Card } from "@/components/ui";
import { Eye, EyeOff, LogIn, AlertCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || "";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<"pending" | "suspended" | "invalid" | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result?.ok) {
      const err = result?.error;
      if (err === "ACCOUNT_PENDING_APPROVAL") {
        setError("pending");
      } else if (err === "ACCOUNT_SUSPENDED") {
        setError("suspended");
      } else {
        setError("invalid");
        toast.error("Incorrect email or password.");
      }
      return;
    }

    // Redirect to the right dashboard based on role
    // Middleware will handle incorrect paths — just redirect to root and let it bounce
    toast.success("Welcome back!");

    // If there's a callbackUrl use it, otherwise fetch the session to route by role
    if (callbackUrl) {
      router.push(callbackUrl);
    } else {
      // Re-fetch session to get role
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const roleMap: Record<string, string> = {
        CLIENT:     "/client/dashboard",
        WRITER:     "/writer/dashboard",
        ANALYST:    "/analyst/dashboard",
        QC:         "/qc/dashboard",
        SUB_ADMIN:  "/admin/dashboard",
        MAIN_ADMIN: "/admin/dashboard",
      };
      router.push(roleMap[session?.user?.role] || "/");
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-8">
          <h1 className="font-clash text-3xl font-700 text-navy-DEFAULT mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-navy-muted">
            Sign in to your iProjectMaster account
          </p>
        </div>

        {/* Error States */}
        {error === "pending" && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex gap-3 items-start">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-700 text-yellow-800">Account Pending Approval</p>
              <p className="text-xs text-yellow-700 mt-1">
                Your account is awaiting review by our admin team. You'll receive an email notification once it's approved. This usually takes 24–48 hours.
              </p>
            </div>
          </div>
        )}

        {error === "suspended" && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-700 text-red-800">Account Suspended</p>
              <p className="text-xs text-red-700 mt-1">
                Your account has been suspended. Please contact the admin team at{" "}
                <a href="mailto:admin@iprojectmaster.com" className="underline font-600">
                  admin@iprojectmaster.com
                </a>{" "}
                for more information.
              </p>
            </div>
          </div>
        )}

        <Card className="shadow-card-hover">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-12"
                  error={error === "invalid" ? "Invalid email or password." : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-[38px] text-navy-muted hover:text-sky-500 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-sky-100 text-center space-y-2">
            <p className="text-sm text-navy-muted">
              New client?{" "}
              <a href="/register?role=client" className="text-sky-600 font-700 hover:underline">
                Create an account
              </a>
            </p>
            <p className="text-sm text-navy-muted">
              Joining as Writer / Analyst / QC?{" "}
              <a href="/register?role=staff" className="text-sky-600 font-700 hover:underline">
                Apply here
              </a>
            </p>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
