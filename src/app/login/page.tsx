"use client";
export const dynamic = "force-dynamic";
// src/app/login/page.tsx
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

const C = {
  wrap:  { minHeight:"100vh", background:"#F0F9FF", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" },
  box:   { width:"100%", maxWidth:"420px" },
  logo:  { textAlign:"center" as const, marginBottom:"2rem" },
  lname: { fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#0C1A2E" },
  lspan: { color:"#38BDF8" },
  lsub:  { fontSize:".85rem", color:"#5B7EA6", marginTop:".3rem" },
  card:  { background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", boxShadow:"0 4px 24px rgba(14,165,233,.08)", padding:"2rem" },
  fg:    { marginBottom:"1.25rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  pw:    { position:"relative" as const },
  eye:   { position:"absolute" as const, right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"1rem" },
  btn:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginBottom:"1rem" },
  btnD:  { opacity:.6, cursor:"not-allowed" as const },
  forgot:{ textAlign:"right" as const, marginBottom:"1.25rem", marginTop:"-.75rem" },
  flink: { background:"none", border:"none", color:"#38BDF8", fontSize:".78rem", fontWeight:600, cursor:"pointer" },
  divider:{ borderTop:"1px solid #E0F2FE", margin:"1.25rem 0" },
  foot:  { textAlign:"center" as const, fontSize:".82rem", color:"#5B7EA6" },
  link:  { background:"none", border:"none", color:"#38BDF8", fontWeight:700, cursor:"pointer", fontSize:".82rem" },
  err:   { background:"#FEF9C3", border:"1px solid #FDE68A", borderRadius:"10px", padding:".75rem 1rem", fontSize:".78rem", color:"#92400E", marginBottom:"1rem", lineHeight:1.5 },
};

function StudentLoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || "/student/dashboard";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errMsg,   setErrMsg]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrMsg("");
    const result = await signIn("credentials", { email, password, portal:"student", redirect:false });
    setLoading(false);

    if (result?.error) {
      if (result.error === "WRONG_PORTAL_USE_STAFF_LOGIN") {
        setErrMsg("This account is for staff. Please use the Staff Login page.");
      } else {
        setErrMsg("Incorrect email or password. Please try again.");
      }
      return;
    }
    toast.success("Welcome back!");
    router.push(callbackUrl);
  }

  return (
    <div style={C.wrap}>
      <div style={C.box}>
        <div style={C.logo}>
          <div style={C.lname}>iProject<span style={C.lspan}>Master</span></div>
          <div style={C.lsub}>Student Portal</div>
        </div>

        <div style={C.card}>
          {errMsg && <div style={C.err}>⚠️ {errMsg}</div>}

          <form onSubmit={handleSubmit}>
            <div style={C.fg}>
              <label style={C.lbl}>Email Address</label>
              <input style={C.inp} type="email" required placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Password</label>
              <div style={C.pw}>
                <input style={C.inp} type={showPw?"text":"password"} required placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" style={C.eye} onClick={()=>setShowPw(p=>!p)}>{showPw?"🙈":"👁"}</button>
              </div>
            </div>
            <div style={C.forgot}>
              <button type="button" style={C.flink} onClick={()=>router.push("/forgot-password")}>
                Forgot password?
              </button>
            </div>
            <button type="submit" style={{...C.btn,...(loading?C.btnD:{})}} disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={C.divider} />
          <div style={C.foot}>
            <p>New here?{" "}
              <button style={C.link} onClick={()=>router.push("/register")}>Create an account →</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#5B7EA6"}}>Loading...</div>}>
      <StudentLoginForm />
    </Suspense>
  );
}
