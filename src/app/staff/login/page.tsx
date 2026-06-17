"use client";
export const dynamic = "force-dynamic";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const ROLE_REDIRECTS: Record<string,string> = {
  WRITER:     "/writer/dashboard",
  ANALYST:    "/analyst/dashboard",
  QC:         "/qc/dashboard",
  SUB_ADMIN:  "/admin/dashboard",
  MAIN_ADMIN: "/admin/dashboard",
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
    const result = await signIn("credentials", { redirect:false, email, password, portal:"staff" });
    if (result?.error) {
      if (result.error === "ACCOUNT_PENDING_APPROVAL") {
        setError("Your account is pending approval. You'll be notified by email once approved.");
      } else if (result.error === "ACCOUNT_SUSPENDED") {
        setError("Your account has been suspended. Please contact support.");
      } else if (result.error === "WRONG_PORTAL_USE_STUDENT_LOGIN") {
        setError("Student accounts cannot log in here.");
      } else {
        setError("Invalid email or password.");
      }
      setLoading(false);
      return;
    }
    const sessionRes = await fetch("/api/auth/session");
    const session    = await sessionRes.json();
    const role       = session?.user?.role;
    toast.success("Welcome back!");
    router.push(ROLE_REDIRECTS[role] || "/writer/dashboard");
  }

  const dark = "#0C1A2E";
  const sky  = "#38BDF8";
  const muted = "#5B7EA6";

  return (
    <div style={{ minHeight:"100vh", background:dark, display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"420px" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#fff" }}>
            iProject<span style={{ color:sky }}>Master</span>
          </div>
          <div style={{ fontSize:".85rem", color:muted, marginTop:".3rem" }}>Staff Portal</div>
          <div style={{ display:"inline-block", marginTop:".5rem", padding:"3px 12px", borderRadius:"999px", background:"rgba(56,189,248,.15)", color:sky, fontSize:".72rem", fontWeight:700, border:"1px solid rgba(56,189,248,.2)" }}>
            Writers · Analysts · QC · Admin
          </div>
        </div>

        <div style={{ background:"rgba(56,189,248,.08)", border:"1px solid rgba(56,189,248,.15)", borderRadius:"12px", padding:".9rem 1.25rem", marginBottom:"1.25rem", fontSize:".78rem", color:"#7DD3FC", textAlign:"center" }}>
          🔒 This portal is for iProjectMaster staff only.
        </div>

        <div style={{ background:"#112240", borderRadius:"20px", border:"1.5px solid rgba(56,189,248,.15)", boxShadow:"0 8px 32px rgba(0,0,0,.3)", padding:"1.75rem" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:"1rem" }}>
              <label style={{ fontSize:".68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#7DD3FC", display:"block", marginBottom:".4rem" }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com"
                style={{ width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid rgba(56,189,248,.2)", fontSize:".85rem", outline:"none", boxSizing:"border-box", background:"rgba(255,255,255,.05)", color:"#fff" }} />
            </div>

            <div style={{ marginBottom:"1rem" }}>
              <label style={{ fontSize:".68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#7DD3FC", display:"block", marginBottom:".4rem" }}>Password</label>
              <div style={{ position:"relative" }}>
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  style={{ width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid rgba(56,189,248,.2)", fontSize:".85rem", outline:"none", boxSizing:"border-box", background:"rgba(255,255,255,.05)", color:"#fff" }} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"1rem" }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div style={{ textAlign:"right", marginBottom:"1rem" }}>
              <button type="button" onClick={() => router.push("/forgot-password")}
                style={{ background:"none", border:"none", color:sky, fontSize:".75rem", fontWeight:600, cursor:"pointer" }}>
                Forgot password?
              </button>
            </div>

            {error && (
              <p style={{ fontSize:".75rem", color:"#FCA5A5", fontWeight:600, marginBottom:".75rem", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", borderRadius:"8px", padding:".6rem .85rem" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:sky, color:dark, fontSize:".88rem", fontWeight:700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={{ textAlign:"center", marginTop:"1.25rem" }}>
            <p style={{ fontSize:".82rem", color:muted }}>
              Want to join as staff?{" "}
              <button onClick={() => router.push("/staff/apply")}
                style={{ background:"none", border:"none", color:sky, fontWeight:700, cursor:"pointer", fontSize:".82rem" }}>
                Apply here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#5B7EA6" }}>Loading...</div>}>
      <StaffLoginForm />
    </Suspense>
  );
}
