"use client";
export const dynamic = "force-dynamic";
// src/app/reset-password/page.tsx
import { useState, useEffect, Suspense } from "react";
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
  title: { fontFamily:"'Syne',sans-serif", fontSize:"1.25rem", fontWeight:800, color:"#0C1A2E", marginBottom:".5rem" },
  sub:   { fontSize:".82rem", color:"#5B7EA6", marginBottom:"1.5rem", lineHeight:1.6 },
  fg:    { marginBottom:"1.25rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", display:"block", marginBottom:".4rem" },
  pw:    { position:"relative" as const },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  eye:   { position:"absolute" as const, right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"1rem" },
  hint:  { fontSize:".7rem", color:"#5B7EA6", marginTop:".3rem" },
  btn:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { opacity:.6, cursor:"not-allowed" as const },
  back:  { textAlign:"center" as const, marginTop:"1.25rem" },
  blink: { background:"none", border:"none", color:"#38BDF8", fontWeight:700, cursor:"pointer", fontSize:".82rem" },
  ok:    { background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:"12px", padding:"1rem", textAlign:"center" as const, fontSize:".85rem", color:"#166534", lineHeight:1.6 },
  err:   { background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:"12px", padding:"1rem", textAlign:"center" as const, fontSize:".85rem", color:"#991B1B", lineHeight:1.6, marginBottom:"1rem" },
};

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") || "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [tokenErr,  setTokenErr]  = useState("");

  useEffect(() => {
    if (!token) setTokenErr("Invalid or missing reset link. Please request a new one.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/password-reset", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else { setTokenErr(data.error || "Something went wrong."); }
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div style={C.wrap}>
      <div style={C.box}>
        <div style={C.logo}>
          <div style={C.lname}>iProject<span style={C.lspan}>Master</span></div>
          <div style={C.lsub}>Academic Writing Services</div>
        </div>
        <div style={C.card}>
          {done ? (
            <>
              <div style={C.ok}>
                ✅ <strong>Password updated!</strong><br/>
                Your password has been changed successfully. You can now log in with your new password.
              </div>
              <div style={C.back}>
                <button style={C.blink} onClick={() => router.push("/login")}>Go to Login →</button>
              </div>
            </>
          ) : tokenErr ? (
            <>
              <div style={C.err}>{tokenErr}</div>
              <div style={C.back}>
                <button style={C.blink} onClick={() => router.push("/forgot-password")}>Request a new reset link →</button>
              </div>
            </>
          ) : (
            <>
              <div style={C.title}>Set New Password</div>
              <div style={C.sub}>Choose a strong password for your account.</div>
              <form onSubmit={handleSubmit}>
                <div style={C.fg}>
                  <label style={C.lbl}>New Password</label>
                  <div style={C.pw}>
                    <input style={C.inp} type={showPw?"text":"password"} required placeholder="Min. 8 characters"
                      value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" style={C.eye} onClick={()=>setShowPw(p=>!p)}>{showPw?"🙈":"👁"}</button>
                  </div>
                  <div style={C.hint}>At least 8 characters</div>
                </div>
                <div style={C.fg}>
                  <label style={C.lbl}>Confirm Password</label>
                  <input style={C.inp} type={showPw?"text":"password"} required placeholder="Repeat password"
                    value={confirm} onChange={e => setConfirm(e.target.value)} />
                </div>
                <button type="submit" style={{...C.btn,...(loading?C.btnD:{})}} disabled={loading}>
                  {loading ? "Updating..." : "Update Password →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#5B7EA6"}}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
