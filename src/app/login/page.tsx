"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

const C = {
  wrap:  { minHeight:"100vh", background:"#F0F9FF", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" },
  box:   { width:"100%", maxWidth:"420px" },
  logo:  { textAlign:"center" as const, marginBottom:"2rem" },
  lname: { fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#0C1A2E" },
  lspan: { color:"#38BDF8" },
  lsub:  { fontSize:".85rem", color:"#5B7EA6", marginTop:".3rem" },
  card:  { background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", boxShadow:"0 4px 24px rgba(14,165,233,.08)", padding:"1.75rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  pw:    { position:"relative" as const },
  eye:   { position:"absolute" as const, right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"1rem" },
  err:   { fontSize:".75rem", color:"#EF4444", fontWeight:600, marginBottom:".75rem" },
  btn:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { opacity:.6, cursor:"not-allowed" as const },
  foot:  { textAlign:"center" as const, marginTop:"1.25rem" },
  flink: { background:"none", border:"none", color:"#0369A1", fontWeight:700, cursor:"pointer", fontSize:".82rem" },
  div:   { textAlign:"center" as const, margin:"1.25rem 0", color:"#5B7EA6", fontSize:".78rem", position:"relative" as const },
  staffBox: { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"12px", padding:"1rem 1.25rem", textAlign:"center" as const, marginTop:"1rem" },
  staffTxt: { fontSize:".78rem", color:"#5B7EA6", marginBottom:".6rem" },
  staffBtn: { display:"inline-flex", alignItems:"center", gap:".4rem", padding:".5rem 1.1rem", borderRadius:"10px", border:"1.5px solid #0C1A2E", background:"none", color:"#0C1A2E", fontSize:".78rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};

function LoginForm() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPw,   setShowPw]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const result = await signIn("credentials", { redirect: false, email, password });
    if (result?.error) {
      setError(
        result.error === "ACCOUNT_PENDING_APPROVAL" ? "Your account is pending admin approval." :
        result.error === "ACCOUNT_SUSPENDED" ? "Your account has been suspended. Contact admin." :
        "Invalid email or password."
      );
      setLoading(false); return;
    }
    router.push("/student/dashboard");
  }

  return (
    <div style={C.wrap}>
      <div style={C.box}>
        <div style={C.logo}>
          <div style={C.lname}>iProject<span style={C.lspan}>Master</span></div>
          <div style={C.lsub}>Student Login</div>
        </div>

        <div style={C.card}>
          <form onSubmit={handleSubmit}>
            <div style={C.fg}>
              <label style={C.lbl}>Email or Phone</label>
              <input style={C.inp} type="text" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@email.com or 08012345678" />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Password</label>
              <div style={C.pw}>
                <input style={C.inp} type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" />
                <button type="button" style={C.eye} onClick={()=>setShowPw(!showPw)}>{showPw?"🙈":"👁"}</button>
              </div>
            </div>
            {error && <p style={C.err}>{error}</p>}
            <button type="submit" style={{...C.btn,...(loading?C.btnD:{})}} disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={C.foot}>
            <p style={{fontSize:".82rem", color:"#5B7EA6"}}>
              New student?{" "}
              <button style={C.flink} onClick={()=>router.push("/register")}>Create account</button>
            </p>
          </div>
        </div>

        {/* Staff login link */}
        <div style={C.staffBox}>
          <p style={C.staffTxt}>Are you a writer, analyst, QC or admin?</p>
          <button style={C.staffBtn} onClick={()=>router.push("/staff/login")}>
            👤 Staff Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#5B7EA6"}}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
