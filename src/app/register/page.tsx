"use client";
// src/app/register/page.tsx
// Smart registration: detects ?role=client or ?role=staff from URL

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button, Input, Select, Card } from "@/components/ui";
import { UserPlus, Eye, EyeOff, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

const ROLE_OPTIONS = [
  { value: "WRITER",  label: "Writer"          },
  { value: "ANALYST", label: "Analyst"          },
  { value: "QC",      label: "Quality Control"  },
];

export default function RegisterPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const mode         = searchParams.get("role") === "staff" ? "staff" : "client";

  const [step, setStep] = useState<"form" | "pending" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const [form, setForm] = useState({
    name:        "",
    email:       "",
    password:    "",
    confirmPw:   "",
    phone:       "",
    role:        "WRITER",
    institution: "",
    department:  "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())                   e.name     = "Full name is required.";
    if (!form.email.trim())                  e.email    = "Email is required.";
    if (form.password.length < 8)            e.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPw)    e.confirmPw = "Passwords do not match.";
    if (mode === "client" && !form.institution) e.institution = "Institution is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        form.name,
          email:       form.email,
          password:    form.password,
          role:        mode === "staff" ? form.role : "CLIENT",
          phone:       form.phone || undefined,
          institution: form.institution || undefined,
          department:  form.department || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed.");
        return;
      }

      if (mode === "staff") {
        setStep("pending"); // staff must wait for approval
      } else {
        setStep("success"); // clients can log in immediately
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Pending approval screen (staff) ──────────────────────
  if (step === "pending") {
    return (
      <AuthLayout>
        <div className="w-full max-w-md text-center fade-up">
          <div className="w-20 h-20 bg-yellow-50 border-2 border-yellow-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <h1 className="font-clash text-2xl font-700 text-navy-DEFAULT mb-3">
            Application Submitted!
          </h1>
          <p className="text-navy-muted text-sm leading-relaxed mb-2">
            Your account has been created and is now <strong>pending admin approval</strong>.
            Our admin team will review your application and get back to you within 24–48 hours.
          </p>
          <p className="text-navy-muted text-sm leading-relaxed mb-8">
            You'll receive an email at <strong className="text-sky-600">{form.email}</strong> once your account is approved or if further information is needed.
          </p>
          <Card className="text-left">
            <p className="text-xs font-700 text-navy-muted uppercase tracking-wider mb-3">What happens next</p>
            <div className="flex flex-col gap-3">
              {[
                "Admin reviews your registration",
                "Account is approved or declined",
                "You receive an email notification",
                "If approved, log in and start working",
              ].map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-700 flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-navy-DEFAULT pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </Card>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 text-sm text-sky-600 font-700 hover:underline"
          >
            Back to Login →
          </button>
        </div>
      </AuthLayout>
    );
  }

  // ── Success screen (client) ───────────────────────────────
  if (step === "success") {
    return (
      <AuthLayout>
        <div className="w-full max-w-md text-center fade-up">
          <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-clash text-2xl font-700 text-navy-DEFAULT mb-3">
            Account Created!
          </h1>
          <p className="text-navy-muted text-sm leading-relaxed mb-8">
            Welcome to iProjectMaster. Your account is ready — you can log in and place your first order right away.
          </p>
          <Button size="lg" className="w-full" onClick={() => router.push("/login")}>
            Log In Now
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // ── Registration form ─────────────────────────────────────
  return (
    <AuthLayout>
      <div className="w-full max-w-lg fade-up">
        {/* Mode switcher */}
        <div className="flex gap-2 p-1 bg-sky-100 rounded-2xl mb-8">
          {[
            { key: "client", label: "I'm a Client" },
            { key: "staff",  label: "I'm a Writer / Analyst / QC" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => router.push(`/register?role=${key}`)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-700 transition-all ${
                mode === key
                  ? "bg-navy-DEFAULT text-sky-400 shadow-sm"
                  : "text-navy-muted hover:text-navy-DEFAULT"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="text-center mb-6">
          <h1 className="font-clash text-3xl font-700 text-navy-DEFAULT mb-2">
            {mode === "client" ? "Create your account" : "Apply to join our team"}
          </h1>
          <p className="text-sm text-navy-muted">
            {mode === "client"
              ? "Start ordering professional academic writing"
              : "Submit your application — admin will review and approve it"}
          </p>
        </div>

        {/* Staff info banner */}
        {mode === "staff" && (
          <div className="mb-5 bg-sky-50 border border-sky-200 rounded-2xl p-4 flex gap-3">
            <Clock className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-sky-800">
              <strong>Note:</strong> Staff accounts require admin approval before you can log in. You'll be notified by email once your account is reviewed.
            </p>
          </div>
        )}

        <Card className="shadow-card-hover">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "staff" && (
              <Select
                label="I am applying as"
                options={ROLE_OPTIONS}
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              />
            )}

            <Input
              label="Full Name"
              placeholder="Chukwuemeka Okonkwo"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              error={errors.name}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+234 800 000 0000"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              hint="Optional but recommended for updates"
            />

            {mode === "client" && (
              <>
                <Input
                  label="Institution / University"
                  placeholder="University of Lagos"
                  value={form.institution}
                  onChange={(e) => set("institution", e.target.value)}
                  error={errors.institution}
                />
                <Input
                  label="Department"
                  placeholder="Business Administration"
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                  hint="Optional — helps us assign the right expert"
                />
              </>
            )}

            <div className="relative">
              <Input
                label="Password"
                type={showPw ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                error={errors.password}
                className="pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-[38px] text-navy-muted hover:text-sky-500 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPw}
              onChange={(e) => set("confirmPw", e.target.value)}
              error={errors.confirmPw}
              required
            />

            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              <UserPlus className="w-4 h-4" />
              {mode === "staff" ? "Submit Application" : "Create Account"}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-sky-100 text-center">
            <p className="text-sm text-navy-muted">
              Already have an account?{" "}
              <a href="/login" className="text-sky-600 font-700 hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
