"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const C = {
  wrap:  { minHeight:"100vh", background:"#F0F9FF", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" },
  box:   { width:"100%", maxWidth:"440px" },
  logo:  { textAlign:"center" as const, marginBottom:"2rem" },
  lname: { fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#0C1A2E" },
  lspan: { color:"#38BDF8" },
  lsub:  { fontSize:".85rem", color:"#5B7EA6", marginTop:".3rem" },
  card:  { background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", boxShadow:"0 4px 24px rgba(14,165,233,.08)", padding:"1.75rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  err:   { fontSize:".75rem", color:"#EF4444", fontWeight:600, marginBottom:".75rem" },
  btn:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { opacity:.6, cursor:"not-allowed" as const },
  foot:  { textAlign:"center" as const, fontSize:".82rem", color:"#5B7EA6", marginTop:"1.25rem" },
  flink: { background:"none", border:"none", color:"#0369A1", fontWeight:700, cursor:"pointer", fontSize:".82rem" },
  success:{ textAlign:"center" as const, padding:"2rem" },
  sicon: { fontSize:"2.5rem", marginBottom:"1rem" },
  stitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:"#0C1A2E", marginBottom:".5rem" },
  ssub:  { fontSize:".83rem", color:"#5B7EA6", marginBottom:"1.5rem", lineHeight:1.6 },
};

function RegisterForm() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role: "CLIENT" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); return; }
      setSuccess(true);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  if (success) {
    return (
      <div style={C.wrap}>
        <div style={C.box}>
          <div style={C.card}>
            <div style={C.success}>
              <div style={C.sicon}>🎉</div>
              <div style={C.stitle}>Account Created!</div>
              <div style={C.ssub}>Your account is ready. Log in and place your first order.</div>
              <button style={C.btn} onClick={() => router.push("/login")}>Go to Login →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={C.wrap}>
      <div style={C.box}>
        <div style={C.logo}>
          <div style={C.lname}>iProject<span style={C.lspan}>Master</span></div>
          <div style={C.lsub}>Create your student account</div>
        </div>
        <div style={C.card}>
          <form onSubmit={handleSubmit}>
            <div style={C.fg}><label style={C.lbl}>Full Name</label><input style={C.inp} value={name} onChange={e=>setName(e.target.value)} required placeholder="Your full name" /></div>
            <div style={C.fg}><label style={C.lbl}>WhatsApp Number <span style={{fontWeight:400,color:"#5B7EA6"}}>(required — we'll reach you here)</span></label><input style={C.inp} value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="08012345678" /></div>
            <div style={C.fg}><label style={C.lbl}>Email Address</label><input style={C.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@email.com" /></div>
            <div style={C.fg}><label style={C.lbl}>Password</label><input style={C.inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Min. 8 characters" /></div>
            <div style={C.fg}><label style={C.lbl}>Confirm Password</label><input style={C.inp} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Re-enter password" /></div>
            {error && <p style={C.err}>{error}</p>}
            <button type="submit" disabled={loading} style={{...C.btn,...(loading?C.btnD:{})}}>
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>
          <div style={C.foot}>
            Already have an account?{" "}
            <button style={C.flink} onClick={() => router.push("/login")}>Sign in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#5B7EA6"}}>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
