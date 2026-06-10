"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<"student"|"staff">(
    (searchParams.get("role") as "student"|"staff") || "student"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (result?.error) {
      setError(
        result.error === "ACCOUNT_PENDING_APPROVAL"
          ? "Your account is pending admin approval."
          : result.error === "ACCOUNT_SUSPENDED"
          ? "Your account has been suspended. Contact admin."
          : "Invalid email or password."
      );
      setLoading(false);
      return;
    }
    router.push(tab === "student" ? "/student/dashboard" : "/writer/dashboard");
  }

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy-DEFAULT">
            iProject<span className="text-sky-500">Master</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Hire a Writer Platform</p>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-sky-200 mb-6">
          <button onClick={() => setTab("student")}
            className={`flex-1 py-3 text-sm font-600 transition-all ${tab==="student" ? "bg-sky-400 text-navy-DEFAULT" : "bg-white text-gray-500"}`}>
            🎓 Student Login
          </button>
          <button onClick={() => setTab("staff")}
            className={`flex-1 py-3 text-sm font-600 transition-all ${tab==="staff" ? "bg-navy-DEFAULT text-sky-400" : "bg-white text-gray-500"}`}>
            👤 Staff Login
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-700 text-gray-700 uppercase tracking-wider block mb-1.5">Email or Phone</label>
              <input type="text" value={email} onChange={e=>setEmail(e.target.value)} required
                placeholder="you@email.com or 08012345678"
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div>
              <label className="text-xs font-700 text-gray-700 uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 pr-10" />
                <button type="button" onClick={()=>setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {showPw?"🙈":"👁"}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-500 font-600">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-sky-400 text-navy-DEFAULT font-700 text-sm hover:bg-sky-500 disabled:opacity-50 transition-all">
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              New student?{" "}
              <button onClick={()=>router.push("/register")} className="text-sky-600 font-700 hover:underline">
                Create account
              </button>
            </p>
            {tab==="staff" && (
              <p className="text-xs text-gray-500 mt-1">
                Want to join as staff?{" "}
                <button onClick={()=>router.push("/register?role=staff")} className="text-sky-600 font-700 hover:underline">
                  Apply here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
