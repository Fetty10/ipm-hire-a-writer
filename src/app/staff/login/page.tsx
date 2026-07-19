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

type ForgotStep = "idle" | "email" | "otp" | "done";

function StaffLoginForm() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPw,   setShowPw]   = useState(false);

  // Forgot password state
  const [forgotStep,  setForgotStep]  = useState<ForgotStep>("idle");
  const [fpEmail,     setFpEmail]     = useState("");
  const [fpOtp,       setFpOtp]       = useState("");
  const [fpNewPw,     setFpNewPw]     = useState("");
  const [fpConfirmPw, setFpConfirmPw] = useState("");
  const [fpLoading,   setFpLoading]   = useState(false);
  

  const dark  = "#0C1A2E";
  const sky   = "#38BDF8";
  const muted = "#5B7EA6";

  const inp = { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid rgba(56,189,248,.2)", fontSize:".85rem", outline:"none", boxSizing:"border-box" as const, background:"rgba(255,255,255,.05)", color:"#fff", fontFamily:"'DM Sans',sans-serif" };
  const lbl = { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#7DD3FC", display:"block", marginBottom:".4rem" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const result = await signIn("credentials", { redirect:false, email, password, portal:"staff" });
    if (result?.error) {
      setError(
        result.error === "ACCOUNT_PENDING_APPROVAL" ? "Your account is pending approval. You'll be notified once approved." :
        result.error === "ACCOUNT_SUSPENDED" ? "Your account has been suspended. Contact support." :
        result.error === "WRONG_PORTAL_USE_STUDENT_LOGIN" ? "Student accounts cannot log in here." :
        "Invalid email or password."
      );
      setLoading(false); return;
    }
    const sessionRes = await fetch("/api/auth/session");
    const session    = await sessionRes.json();
    const role       = session?.user?.role;
    toast.success("Welcome back!");
    router.push(ROLE_REDIRECTS[role] || "/writer/dashboard");
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
    if (!fpOtp.trim())     { toast.error("Please enter the OTP."); return; }
    if (!fpNewPw)          { toast.error("Please enter a new password."); return; }
    if (fpNewPw.length < 8){ toast.error("Password must be at least 8 characters."); return; }
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
      <div style={{ minHeight:"100vh", background:dark, display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ width:"100%", maxWidth:"420px" }}>
          <div style={{ textAlign:"center", marginBottom:"2rem" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#fff" }}>
              iProject<span style={{ color:sky }}>Master</span>
            </div>
            <div style={{ fontSize:".85rem", color:muted, marginTop:".3rem" }}>Reset Password</div>
          </div>

          <div style={{ background:"#112240", borderRadius:"20px", border:"1.5px solid rgba(56,189,248,.15)", padding:"1.75rem" }}>
            {forgotStep === "email" && (
              <>
                <p style={{ fontSize:".82rem", color:"#94A3B8", marginBottom:"1rem", lineHeight:1.6 }}>
                  Enter your email and we'll send a reset code to your email address.
                </p>
                <div style={{ marginBottom:"1rem" }}>
                  <label style={lbl}>Email Address</label>
                  <input style={inp} type="email" value={fpEmail} onChange={e=>setFpEmail(e.target.value)} placeholder="your@email.com" autoFocus />
                </div>
                <button disabled={fpLoading} onClick={handleSendOtp}
                  style={{ width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:sky, color:dark, fontSize:".88rem", fontWeight:700, cursor:fpLoading?"not-allowed":"pointer", opacity:fpLoading?.6:1 }}>
                  {fpLoading ? "Sending..." : "Send Reset Code →"}
                </button>
              </>
            )}

            {forgotStep === "otp" && (
              <>
                <p style={{ fontSize:".82rem", color:"#94A3B8", marginBottom:"1rem", lineHeight:1.6 }}>
                  A 6-digit code was sent to your email address .
                </p>
                <div style={{ marginBottom:"1rem" }}>
                  <label style={lbl}>OTP Code</label>
                  <div style={{ display:"flex", gap:".5rem" }}>
                    <input style={{...inp, flex:1, letterSpacing:".3em", textAlign:"center" as const, fontSize:"1.1rem"}}
                      type="text" inputMode="numeric" maxLength={6} value={fpOtp}
                      onChange={e=>setFpOtp(e.target.value.replace(/\D/g,""))} placeholder="------" />
                    <button onClick={handleSendOtp} disabled={fpLoading}
                      style={{ padding:".5rem .75rem", borderRadius:"10px", border:"1px solid rgba(56,189,248,.3)", background:"none", color:sky, cursor:"pointer", fontSize:".75rem", fontWeight:700, whiteSpace:"nowrap" as const }}>
                      Resend
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom:"1rem" }}>
                  <label style={lbl}>New Password</label>
                  <input style={inp} type="password" value={fpNewPw} onChange={e=>setFpNewPw(e.target.value)} placeholder="Min. 8 characters" />
                </div>
                <div style={{ marginBottom:"1rem" }}>
                  <label style={lbl}>Confirm New Password</label>
                  <input style={inp} type="password" value={fpConfirmPw} onChange={e=>setFpConfirmPw(e.target.value)} placeholder="Re-enter password" />
                </div>
                <button disabled={fpLoading} onClick={handleResetPassword}
                  style={{ width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:sky, color:dark, fontSize:".88rem", fontWeight:700, cursor:fpLoading?"not-allowed":"pointer", opacity:fpLoading?.6:1 }}>
                  {fpLoading ? "Resetting..." : "Reset Password →"}
                </button>
              </>
            )}

            {forgotStep === "done" && (
              <>
                <div style={{ textAlign:"center", marginBottom:"1.25rem" }}>
                  <div style={{ fontSize:"2.5rem", marginBottom:".5rem" }}>✅</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#fff", marginBottom:".4rem" }}>Password Reset!</div>
                  <p style={{ fontSize:".83rem", color:"#94A3B8" }}>Your password has been updated. You can now log in.</p>
                </div>
                <button style={{ width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:sky, color:dark, fontSize:".88rem", fontWeight:700, cursor:"pointer" }}
                  onClick={()=>{ setForgotStep("idle"); setFpEmail(""); setFpOtp(""); setFpNewPw(""); setFpConfirmPw(""); }}>
                  Back to Login →
                </button>
              </>
            )}

            {forgotStep !== "done" && (
              <div style={{ textAlign:"center", marginTop:"1rem" }}>
                <button style={{ background:"none", border:"none", color:sky, fontSize:".78rem", fontWeight:600, cursor:"pointer" }}
                  onClick={()=>setForgotStep("idle")}>← Back to Login</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Login View ────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:dark, display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"420px" }}>
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
              <label style={lbl}>Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com" style={inp} />
            </div>
            <div style={{ marginBottom:"1rem" }}>
              <label style={lbl}>Password</label>
              <div style={{ position:"relative" }}>
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" style={inp} />
                <button type="button" onClick={()=>setShowPw(p=>!p)}
                  style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"1rem" }}>
                  {showPw?"🙈":"👁"}
                </button>
              </div>
            </div>
            <div style={{ textAlign:"right", marginBottom:"1rem" }}>
              <button type="button" onClick={()=>{ setFpEmail(email); setForgotStep("email"); }}
                style={{ background:"none", border:"none", color:sky, fontSize:".75rem", fontWeight:600, cursor:"pointer" }}>
                Forgot Password?
              </button>
            </div>
            {error && (
              <p style={{ fontSize:".75rem", color:"#FCA5A5", fontWeight:600, marginBottom:".75rem", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", borderRadius:"8px", padding:".6rem .85rem" }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:sky, color:dark, fontSize:".88rem", fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?.6:1 }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={{ textAlign:"center", marginTop:"1.25rem" }}>
            <p style={{ fontSize:".82rem", color:muted }}>
              Want to join as staff?{" "}
              <button onClick={()=>router.push("/staff/apply")}
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
