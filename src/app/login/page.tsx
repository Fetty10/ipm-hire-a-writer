"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

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
  btnGhost: { background:"none", border:"none", color:"#0369A1", fontWeight:700, cursor:"pointer", fontSize:".82rem", padding:0 },
  foot:  { textAlign:"center" as const, marginTop:"1.25rem" },
  flink: { background:"none", border:"none", color:"#0369A1", fontWeight:700, cursor:"pointer", fontSize:".82rem" },
  div:   { textAlign:"center" as const, margin:"1.25rem 0", color:"#5B7EA6", fontSize:".78rem" },
  hint:  { fontSize:".75rem", color:"#5B7EA6", marginBottom:"1rem", lineHeight:1.5 },
  otpRow:{ display:"flex", gap:".5rem" },
};

type ForgotStep = "idle" | "email" | "otp" | "done";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || null;

  // Login state
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPw,   setShowPw]   = useState(false);

  // Forgot password state
  const [forgotStep,   setForgotStep]   = useState<ForgotStep>("idle");
  const [fpEmail,      setFpEmail]      = useState("");
  const [fpOtp,        setFpOtp]        = useState("");
  const [fpNewPw,      setFpNewPw]      = useState("");
  const [fpConfirmPw,  setFpConfirmPw]  = useState("");
  const [fpLoading,    setFpLoading]    = useState(false);
  

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
    router.push(callbackUrl || "/student/dashboard");
  }

  async function handleSendOtp() {
    if (!fpEmail.trim()) { toast.error("Please enter your email."); return; }
    setFpLoading(true);
    const res  = await fetch("/api/auth/forgot-password", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"send_otp", email:fpEmail.trim() }),
    });
    const data = await res.json();
    setFpLoading(false);
    if (!res.ok) { toast.error(data.error || "Something went wrong."); return; }
    setForgotStep("otp");
  }

  async function handleResetPassword() {
    if (!fpOtp.trim())   { toast.error("Please enter the OTP."); return; }
    if (!fpNewPw)        { toast.error("Please enter a new password."); return; }
    if (fpNewPw.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (fpNewPw !== fpConfirmPw) { toast.error("Passwords do not match."); return; }
    setFpLoading(true);
    const res  = await fetch("/api/auth/forgot-password", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"reset", email:fpEmail.trim(), otp:fpOtp.trim(), newPassword:fpNewPw }),
    });
    const data = await res.json();
    setFpLoading(false);
    if (!res.ok) { toast.error(data.error || "Something went wrong."); return; }
    setForgotStep("done");
  }

  // ── Forgot Password View ──────────────────────────────
  if (forgotStep !== "idle") {
    return (
      <div style={C.wrap}>
        <div style={C.box}>
          <div style={C.logo}>
            <div style={C.lname}>iProject<span style={C.lspan}>Master</span></div>
            <div style={C.lsub}>Reset Password</div>
          </div>

          <div style={C.card}>
            {forgotStep === "email" && (
              <>
                <p style={C.hint}>Enter your email address and we'll send a reset code to your email address.</p>
                <div style={C.fg}>
                  <label style={C.lbl}>Email Address</label>
                  <input style={C.inp} type="email" value={fpEmail} onChange={e=>setFpEmail(e.target.value)}
                    placeholder="you@email.com" autoFocus />
                </div>
                <button style={{...C.btn,...(fpLoading?C.btnD:{})}} disabled={fpLoading} onClick={handleSendOtp}>
                  {fpLoading ? "Sending..." : "Send Reset Code →"}
                </button>
              </>
            )}

            {forgotStep === "otp" && (
              <>
                <p style={C.hint}>
                  A 6-digit code was sent to your email address . Enter it below.
                </p>
                <div style={C.fg}>
                  <label style={C.lbl}>OTP Code</label>
                  <div style={C.otpRow}>
                    <input style={{...C.inp, flex:1, letterSpacing:".3em", textAlign:"center" as const, fontSize:"1.1rem"}}
                      type="text" inputMode="numeric" maxLength={6} value={fpOtp}
                      onChange={e=>setFpOtp(e.target.value.replace(/\D/g,""))} placeholder="------" />
                    <button onClick={handleSendOtp} disabled={fpLoading}
                      style={{padding:".5rem .75rem",borderRadius:"10px",border:"1.5px solid #BAE6FD",background:"#fff",cursor:"pointer",fontSize:".75rem",fontWeight:700,color:"#0369A1",whiteSpace:"nowrap" as const}}>
                      Resend
                    </button>
                  </div>
                </div>
                <div style={C.fg}>
                  <label style={C.lbl}>New Password</label>
                  <input style={C.inp} type="password" value={fpNewPw} onChange={e=>setFpNewPw(e.target.value)}
                    placeholder="Min. 8 characters" />
                </div>
                <div style={C.fg}>
                  <label style={C.lbl}>Confirm New Password</label>
                  <input style={C.inp} type="password" value={fpConfirmPw} onChange={e=>setFpConfirmPw(e.target.value)}
                    placeholder="Re-enter password" />
                </div>
                <button style={{...C.btn,...(fpLoading?C.btnD:{})}} disabled={fpLoading} onClick={handleResetPassword}>
                  {fpLoading ? "Resetting..." : "Reset Password →"}
                </button>
              </>
            )}

            {forgotStep === "done" && (
              <>
                <div style={{textAlign:"center" as const, marginBottom:"1.25rem"}}>
                  <div style={{fontSize:"2.5rem", marginBottom:".5rem"}}>✅</div>
                  <div style={{fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#0C1A2E", marginBottom:".4rem"}}>Password Reset!</div>
                  <p style={{fontSize:".83rem", color:"#5B7EA6"}}>Your password has been updated. You can now log in with your new password.</p>
                </div>
                <button style={C.btn} onClick={()=>{ setForgotStep("idle"); setFpEmail(""); setFpOtp(""); setFpNewPw(""); setFpConfirmPw(""); }}>
                  Back to Login →
                </button>
              </>
            )}

            {forgotStep !== "done" && (
              <div style={{textAlign:"center" as const, marginTop:"1rem"}}>
                <button style={C.btnGhost} onClick={()=>setForgotStep("idle")}>← Back to Login</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Login View ────────────────────────────────────────
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
            <div style={{textAlign:"right" as const, marginTop:"-.5rem", marginBottom:".75rem"}}>
              <button type="button" style={C.btnGhost} onClick={()=>{ setFpEmail(email); setForgotStep("email"); }}>
                Forgot Password?
              </button>
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
