"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const C = {
  wrap:  { minHeight:"100vh", background:"#0C1A2E", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" },
  box:   { width:"100%", maxWidth:"480px" },
  logo:  { textAlign:"center" as const, marginBottom:"2rem" },
  lname: { fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#fff" },
  lspan: { color:"#38BDF8" },
  lsub:  { fontSize:".85rem", color:"#5B7EA6", marginTop:".3rem" },
  ltag:  { display:"inline-block", marginTop:".5rem", padding:"3px 12px", borderRadius:"999px", background:"rgba(56,189,248,.15)", color:"#38BDF8", fontSize:".72rem", fontWeight:700, border:"1px solid rgba(56,189,248,.2)" },
  card:  { background:"#112240", borderRadius:"20px", border:"1.5px solid rgba(56,189,248,.15)", boxShadow:"0 8px 32px rgba(0,0,0,.3)", padding:"1.75rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#7DD3FC", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid rgba(56,189,248,.2)", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, background:"rgba(255,255,255,.05)", color:"#fff" },
  sel:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid rgba(56,189,248,.2)", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, background:"#112240", color:"#fff" },
  err:   { fontSize:".75rem", color:"#FCA5A5", fontWeight:600, marginBottom:".75rem" },
  btn:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { opacity:.6, cursor:"not-allowed" as const },
  foot:  { textAlign:"center" as const, fontSize:".82rem", color:"#5B7EA6", marginTop:"1.25rem" },
  flink: { background:"none", border:"none", color:"#38BDF8", fontWeight:700, cursor:"pointer", fontSize:".82rem" },
  notice:{ background:"rgba(56,189,248,.08)", border:"1px solid rgba(56,189,248,.15)", borderRadius:"12px", padding:".9rem 1.25rem", marginBottom:"1.25rem", fontSize:".78rem", color:"#7DD3FC" },
  success:{ textAlign:"center" as const, padding:"2rem" },
  sicon: { fontSize:"2.5rem", marginBottom:"1rem" },
  stitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:"#fff", marginBottom:".5rem" },
  ssub:  { fontSize:".83rem", color:"#5B7EA6", marginBottom:"1.5rem", lineHeight:1.6 },
  backBox:{ textAlign:"center" as const, marginTop:"1.25rem" },
  backBtn:{ background:"none", border:"none", color:"#5B7EA6", fontSize:".78rem", cursor:"pointer", textDecoration:"underline" },
};

function StaffApplyForm() {
  const router = useRouter();
  const [role,     setRole]     = useState("WRITER");
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
        body: JSON.stringify({ name, email, phone, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Application failed. Please try again."); return; }
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
              <div style={C.sicon}>⏳</div>
              <div style={C.stitle}>Application Submitted!</div>
              <div style={C.ssub}>
                Thank you for applying. Our admin team will review your application and notify you by email once your account is approved. This usually takes 1–2 business days.
              </div>
              <button style={C.btn} onClick={() => router.push("/staff/login")}>Back to Staff Login</button>
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
          <div style={C.lsub}>Staff Application</div>
          <div style={C.ltag}>Join our writing team</div>
        </div>

        <div style={C.notice}>
          ℹ Your application will be reviewed by our admin team before you can log in. You'll receive an email notification once approved.
        </div>

        <div style={C.card}>
          <form onSubmit={handleSubmit}>
            {/* Role selector */}
            <div style={C.fg}>
              <label style={C.lbl}>Applying as</label>
              <select style={C.sel} value={role} onChange={e => setRole(e.target.value)}>
                <option value="WRITER">Writer (Chapters 1, 2 & 5)</option>
                <option value="ANALYST">Analyst (Chapters 3 & 4)</option>
                <option value="QC">Quality Control</option>
              </select>
            </div>

            <div style={C.fg}><label style={C.lbl}>Full Name</label><input style={C.inp} value={name} onChange={e=>setName(e.target.value)} required placeholder="Your full name" /></div>
            <div style={C.fg}><label style={C.lbl}>Phone Number</label><input style={C.inp} value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="08012345678" /></div>
            <div style={C.fg}><label style={C.lbl}>Email Address</label><input style={C.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com" /></div>
            <div style={C.fg}><label style={C.lbl}>Password</label><input style={C.inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Min. 8 characters" /></div>
            <div style={C.fg}><label style={C.lbl}>Confirm Password</label><input style={C.inp} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Re-enter password" /></div>

            {error && <p style={C.err}>{error}</p>}

            <button type="submit" disabled={loading} style={{...C.btn,...(loading?C.btnD:{})}}>
              {loading ? "Submitting..." : "Submit Application →"}
            </button>
          </form>

          <div style={C.foot}>
            Already have an account?{" "}
            <button style={C.flink} onClick={() => router.push("/staff/login")}>Staff Login</button>
          </div>
        </div>

        
      </div>
    </div>
  );
}

export default function StaffApplyPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#5B7EA6"}}>Loading...</div>}>
      <StaffApplyForm />
    </Suspense>
  );
}
