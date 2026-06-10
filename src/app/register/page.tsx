"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isStaff = searchParams.get("role") === "staff";
  const [role, setRole] = useState<"CLIENT"|"WRITER"|"ANALYST"|"QC">(
    isStaff ? "WRITER" : "CLIENT"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); return; }
      setSuccess(true);
    } catch { setError("Something went wrong."); }
    finally { setLoading(false); }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">{role === "CLIENT" ? "🎉" : "⏳"}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {role === "CLIENT" ? "Account Created!" : "Application Submitted!"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {role === "CLIENT"
              ? "You can now log in and place your first order."
              : "Your application is under review. Admin will notify you once approved."}
          </p>
          <button onClick={() => router.push("/login")}
            className="w-full py-3 rounded-xl bg-sky-400 text-navy-DEFAULT font-700 text-sm hover:bg-sky-500 transition-all">
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            iProject<span className="text-sky-500">Master</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-sky-200 mb-6">
          <button onClick={() => setRole("CLIENT")}
            className={`flex-1 py-3 text-sm font-600 transition-all ${role==="CLIENT" ? "bg-sky-400 text-gray-900" : "bg-white text-gray-500"}`}>
            🎓 Student
          </button>
          <button onClick={() => setRole("WRITER")}
            className={`flex-1 py-3 text-sm font-600 transition-all ${role!=="CLIENT" ? "bg-gray-900 text-sky-400" : "bg-white text-gray-500"}`}>
            ✍️ Staff
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6">
          {role !== "CLIENT" && (
            <div className="mb-4">
              <label className="text-xs font-700 text-gray-700 uppercase tracking-wider block mb-1.5">Role</label>
              <select value={role} onChange={e=>setRole(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
                <option value="WRITER">Writer</option>
                <option value="ANALYST">Analyst</option>
                <option value="QC">Quality Control</option>
              </select>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-700 text-gray-700 uppercase tracking-wider block mb-1.5">Full Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} required placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div>
              <label className="text-xs font-700 text-gray-700 uppercase tracking-wider block mb-1.5">Phone Number</label>
              <input value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="08012345678"
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div>
              <label className="text-xs font-700 text-gray-700 uppercase tracking-wider block mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@email.com"
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div>
              <label className="text-xs font-700 text-gray-700 uppercase tracking-wider block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Min. 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div>
              <label className="text-xs font-700 text-gray-700 uppercase tracking-wider block mb-1.5">Confirm Password</label>
              <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            {error && <p className="text-xs text-red-500 font-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-sky-400 text-gray-900 font-700 text-sm hover:bg-sky-500 disabled:opacity-50 transition-all">
              {loading ? "Creating..." : role==="CLIENT" ? "Create Account →" : "Submit Application →"}
            </button>
          </form>
          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an account?{" "}
            <button onClick={() => router.push("/login")} className="text-sky-600 font-700 hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
