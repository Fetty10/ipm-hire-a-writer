"use client";
// src/app/staff/login/page.tsx

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const C = {
  root:   { minHeight:"100vh", background:"#0C1A2E", display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:"'DM Sans',sans-serif" },
  box:    { width:"100%", maxWidth:"420px" },
  logo:   { textAlign:"center" as const, marginBottom:"2rem" },
  brand:  { fontFamily:"'Syne',sans-serif", fontSize:"1.5rem", fontWeight:800, color:"#fff", letterSpacing:"-.02em" },
  accent: { color:"#38BDF8" },
  role:   { fontSize:".78rem", color:"#7DD3FC", marginTop:".3rem" },
  card:   { background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:"20px", padding:"2rem" },
  h2:     { fontFamily:"'Syne',sans-serif", fontSize:"1.25rem", fontWeight:800, color:"#fff", marginBottom:".25rem" },
  sub:    { fontSize:".82rem", color:"#7DD3FC", marginBottom:"1.5rem" },
  fg:     { marginBottom:"1rem" },
  lbl:    { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#7DD3FC", display:"block", marginBottom:".4rem" },
  inp:    { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid rgba(255,255,255,.12)", background:"rgba(255,255,255,.06)", color:"#fff", fontSize:".88rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  pwWrap: { position:"relative" as const },
  eye:    { position:"absolute" as const, right:".75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#7DD3FC", fontSize:"1rem", padding:0 },
  errBox: { background:"rgba(239,68,68,.12)", border:"1px solid rgba(239,68,68,.3)", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".82rem", color:"#FCA5A5" },
  btn:    { width:"100%", padding:".85rem", borderRadius:"12px", background:"#38BDF8", color:"#0C1A2E", fontSize:".9rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginTop:".5rem" },
  btnDis: { opacity:.6, cursor:"not-allowed" as const },
  foot:   { textAlign:"center" as const, marginTop:"1.25rem", fontSize:".78rem", color:"#7DD3FC" },
  link:   { color:"#38BDF8", fontWeight:600, textDecoration:"none", cursor:"pointer" },
  divider:{ textAlign:"center" as const, marginTop:"1.5rem", fontSize:".75rem", color:"rgba(255,255,255,.2)" },
  apply:  { display:"block", textAlign:"center" as const, marginTop:".75rem", padding:".65rem", borderRadius:"10px", border:"1px solid rgba(56,189,248,.3)", color:"#38BDF8", fontSize:".82rem", fontWeight:600, textDecoration:"none", cursor:"pointer", background:"none" },
};

function StaffLoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || "";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string|null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      portal:   "staff",
      redirect: false,
    });

    setLoading(false);

    if (!result?.ok) {
      const err = result?.error;
      if (err === "ACCOUNT_PENDING_APPROVAL") {
        setError("Your account is pending admin approval. You'll receive an email once approved.");
      } else if (err === "ACCOUNT_SUSPENDED") {
        setError("Your account has been suspended. Please contact admin.");
      } else if (err === "WRONG_PORTAL_USE_STUDENT_LOGIN") {
        setError("Student accounts cannot log in here. Please use the Student Login page.");
      } else {
        setError("Incorrect email or password. Please try again.");
      }
      return;
    }

    // Redirect based on role
    const sessionRes = await fetch("/api/auth/session");
    const session    = await sessionRes.json();
    const role       = session?.user?.role;

    if (role === "WRITER")     { router.push("/writer/dashboard"); return; }
    if (role === "ANALYST")    { router.push("/analyst/dashboard"); return; }
    if (role === "QC")         { router.push("/qc/dashboard"); return; }
    if (role === "MAIN_ADMIN" || role === "SUB_ADMIN") { router.push("/admin/dashboard"); return; }

    router.push("/staff/login");
  }

  return (
    <div style={C.root}>
      <div style={C.box}>
        <div style={C.logo}>
          <div style={C.brand}>iProject<span style={C.accent}>Master</span></div>
          <div style={C.role}>Staff Portal</div>
        </div>

        <div style={C.card}>
          <div style={C.h2}>Welcome back</div>
          <div style={C.sub}>Sign in to your staff account</div>

          {error && <div style={C.errBox}>⚠ {error}</div>}

          <form onSubmit={handleLogin}>
            <div style={C.fg}>
              <label style={C.lbl}>Email Address</label>
              <input
                style={C.inp}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div style={C.fg}>
              <label style={C.lbl}>Password</label>
              <div style={C.pwWrap}>
                <input
                  style={C.inp}
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" style={C.eye} onClick={() => setShowPw(p => !p)}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{...C.btn,...(loading?C.btnDis:{})}}
              disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={C.divider}>— Not yet on the team? —</div>
          <button style={C.apply} onClick={() => router.push("/staff/apply")}>
            Apply to Join as Writer / Analyst / QC
          </button>
        </div>

        <div style={C.foot}>
          Not staff?{" "}
          <span style={C.link} onClick={() => router.push("/login")}>
            Student Login →
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"#0C1A2E"}}/>}>
      <StaffLoginContent />
    </Suspense>
  );
}
