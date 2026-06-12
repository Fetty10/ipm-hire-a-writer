"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

const ROLE_REDIRECTS: Record<string, string> = {
  WRITER:     "/writer/dashboard",
  ANALYST:    "/analyst/dashboard",
  QC:         "/qc/dashboard",
  SUB_ADMIN:  "/admin/dashboard",
  MAIN_ADMIN: "/admin/dashboard",
};

const C = {
  wrap:    { minHeight:"100vh", background:"#0C1A2E", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" },
  box:     { width:"100%", maxWidth:"420px" },
  logo:    { textAlign:"center" as const, marginBottom:"2rem" },
  lname:   { fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#fff" },
  lspan:   { color:"#38BDF8" },
  lsub:    { fontSize:".85rem", color:"#5B7EA6", marginTop:".3rem" },
  ltag:    { display:"inline-block", marginTop:".5rem", padding:"3px 12px", borderRadius:"999px", background:"rgba(56,189,248,.15)", color:"#38BDF8", fontSize:".72rem", fontWeight:700, border:"1px solid rgba(56,189,248,.2)" },
  card:    { background:"#112240", borderRadius:"20px", border:"1.5px solid rgba(56,189,248,.15)", boxShadow:"0 8px 32px rgba(0,0,0,.3)", padding:"1.75rem" },
  fg:      { marginBottom:"1rem" },
  lbl:     { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#7DD3FC", display:"block", marginBottom:".4rem" },
  inp:     { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid rgba(56,189,248,.2)", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, background:"rgba(255,255,255,.05)", color:"#fff" },
  pw:      { position:"relative" as const },
  eye:     { position:"absolute" as const, right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"1rem" },
  err:     { fontSize:".75rem", color:"#FCA5A5", fontWeight:600, marginBottom:".75rem", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", borderRadius:"8px", padding:".6rem .85rem" },
  btn:     { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:    { opacity:0.6, cursor:"not-allowed" as const },
  foot:    { textAlign:"center" as const, marginTop:"1.25rem" },
  flink:   { background:"none", border:"none", color:"#38BDF8", fontWeight:700, cursor:"pointer", fontSize:".82rem" },
  notice:  { background:"rgba(56,189,248,.08)", border:"1px solid rgba(56,189,248,.15)", borderRadius:"12px", padding:".9rem 1.25rem", marginBottom:"1.25rem", fontSize:".78rem", color:"#7DD3FC", textAlign:"center" as const },
  stuLink: { display:"block", textAlign:"center" as const, marginTop:"1rem", fontSize:".78rem", color:"#5B7EA6" },
};

function StaffLoginForm() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPw,   setShowPw]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect:  false,
      email,
      password,
      portal:    "staff",
    });

    if (result?.error) {
      if (result.error === "ACCOUNT_PENDING_APPROVAL") {
        setError("Your account is pending admin approval. You'll be notified by email once approved.");
      } else if (result.error === "ACCOUNT_SUSPENDED") {
        setError("Your account has been suspended. Please contact admin.");
      } else if (result.error === "WRONG_PORTAL_USE_STUDENT_LOGIN") {
        setError("Student accounts cannot log in here. Please use the Student Login page.");
      } else {
        setError("Invalid email or password.");
      }
      setLoading(false);
      return;
    }

    // Fetch session to determine role-based redirect
    const sessionRes = await fetch("/api/auth/session");
    const session    = await sessionRes.json();
    const role       = session?.user?.role;
    const redirect   = ROLE_REDIRECTS[role] || "/writer/dashboard";
    router.push(redirect);
  }

  return (
    <div style={C.wrap}>
      <div style={C.box}>
        <div style={C.logo}>
          <div style={C.lname}>iProject<span style={C.lspan}>Master</span></div>
          <div style={C.lsub}>Staff Portal</div>
          <div style={C.ltag}>Writers · Analysts · QC · Admin</div>
        </div>

        <div style={C.notice}>🔒 This portal is for iProjectMaster staff only.</div>

        <div style={C.card}>
          <form onSubmit={handleSubmit}>
            <div style={C.fg}>
              <label style={C.lbl}>Email Address</label>
              <input style={C.inp} type="text" value={email}
                onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Password</label>
              <div style={C.pw}>
                <input style={C.inp} type={showPw?"text":"password"} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                <button type="button" style={C.eye} onClick={() => setShowPw(p => !p)}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {error && <p style={C.err}>{error}</p>}

            <button type="submit" style={{...C.btn,...(loading?C.btnD:{})}} disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={C.foot}>
            <p style={{fontSize:".82rem", color:"#5B7EA6"}}>
              Want to join as staff?{" "}
              <button style={C.flink} onClick={() => router.push("/staff/apply")}>Apply here</button>
            </p>
          </div>
        </div>

        <div style={C.stuLink}>
          Not staff?{" "}
          <button style={{...C.flink, fontSize:".78rem"}} onClick={() => router.push("/login")}>
            Student Login →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#5B7EA6"}}>Loading...</div>}>
      <StaffLoginForm />
    </Suspense>
  );
}
