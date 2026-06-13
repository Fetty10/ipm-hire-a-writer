"use client";
export const dynamic = "force-dynamic";
// src/app/forgot-password/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  btn:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { opacity:.6, cursor:"not-allowed" as const },
  back:  { textAlign:"center" as const, marginTop:"1.25rem" },
  blink: { background:"none", border:"none", color:"#38BDF8", fontWeight:700, cursor:"pointer", fontSize:".82rem" },
  ok:    { background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:"12px", padding:"1rem", textAlign:"center" as const, fontSize:".85rem", color:"#166534", lineHeight:1.6 },
};

export default function ForgotPasswordPage() {
  const router  = useRouter();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/password-reset", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) setSent(true);
      else toast.error(data.error || "Something went wrong.");
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
          {sent ? (
            <>
              <div style={C.ok}>
                ✅ <strong>Check your email!</strong><br/>
                If an account exists for <strong>{email}</strong>, we've sent a password reset link. It expires in 1 hour.<br/><br/>
                Didn't receive it? Check your spam folder.
              </div>
              <div style={C.back}>
                <button style={C.blink} onClick={() => router.push("/login")}>← Back to Login</button>
              </div>
            </>
          ) : (
            <>
              <div style={C.title}>Forgot Password?</div>
              <div style={C.sub}>Enter the email address linked to your account and we'll send you a reset link.</div>
              <form onSubmit={handleSubmit}>
                <div style={C.fg}>
                  <label style={C.lbl}>Email Address</label>
                  <input style={C.inp} type="email" required placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button type="submit" style={{...C.btn,...(loading?C.btnD:{})}} disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link →"}
                </button>
              </form>
              <div style={C.back}>
                <button style={C.blink} onClick={() => router.push("/login")}>← Back to Login</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
