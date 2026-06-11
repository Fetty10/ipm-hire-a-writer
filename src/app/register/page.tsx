"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

const C = {
  wrap:  { minHeight:"100vh", background:"#F0F9FF", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" },
  box:   { width:"100%", maxWidth:"440px" },
  logo:  { textAlign:"center" as const, marginBottom:"2rem" },
  lname: { fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#0C1A2E" },
  lspan: { color:"#38BDF8" },
  lsub:  { fontSize:".85rem", color:"#5B7EA6", marginTop:".3rem" },
  tabs:  { display:"flex", borderRadius:"12px", overflow:"hidden", border:"1.5px solid #BAE6FD", marginBottom:"1.5rem" },
  tab:   { flex:1, padding:".75rem", fontSize:".82rem", fontWeight:700, cursor:"pointer", border:"none", transition:"all .2s", fontFamily:"'DM Sans',sans-serif" },
  tabA:  { background:"#38BDF8", color:"#0C1A2E" },
  tabAD: { background:"#0C1A2E", color:"#38BDF8" },
  tabI:  { background:"#fff", color:"#5B7EA6" },
  card:  { background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", boxShadow:"0 4px 24px rgba(14,165,233,.08)", padding:"1.75rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, color:"#0C1A2E" },
  sel:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, color:"#0C1A2E", background:"#fff" },
  err:   { fontSize:".75rem", color:"#EF4444", fontWeight:600, marginBottom:".75rem" },
  btn:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .2s", marginTop:".5rem" },
  btnS:  { background:"#38BDF8", color:"#0C1A2E" },
  btnD:  { background:"#0C1A2E", color:"#38BDF8" },
  foot:  { textAlign:"center" as const, fontSize:".78rem", color:"#5B7EA6", marginTop:"1.25rem" },
  flink: { background:"none", border:"none", color:"#0369A1", fontWeight:700, cursor:"pointer", fontSize:".78rem" },
  success:{ textAlign:"center" as const, padding:"2rem" },
  sicon: { fontSize:"2.5rem", marginBottom:"1rem" },
  stitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:"#0C1A2E", marginBottom:".5rem" },
  ssub:  { fontSize:".83rem", color:"#5B7EA6", marginBottom:"1.5rem", lineHeight:1.6 },
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isStaff = searchParams.get("role") === "staff";
  const [role, setRole] = useState<"CLIENT"|"WRITER"|"ANALYST"|"QC">(isStaff ? "WRITER" : "CLIENT");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const isClient = role === "CLIENT";

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
              <div style={C.sicon}>{isClient ? "🎉" : "⏳"}</div>
              <div style={C.stitle}>{isClient ? "Account Created!" : "Application Submitted!"}</div>
              <div style={C.ssub}>
                {isClient
                  ? "Your account is ready. Log in and place your first order."
                  : "Your application is under review. Admin will notify you once approved. You'll receive an email when your account is ready."}
              </div>
              <button
                style={{...C.btn,...(isClient?C.btnS:C.btnD)}}
                onClick={() => router.push("/login")}>
                Go to Login →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={C.wrap}>
      <div style={C.box}>
        {/* Logo */}
        <div style={C.logo}>
          <div style={C.lname}>iProject<span style={C.lspan}>Master</span></div>
          <div style={C.lsub}>Create your account</div>
        </div>

        {/* Tab switcher */}
        <div style={C.tabs}>
          <button style={{...C.tab,...(isClient?C.tabA:C.tabI)}} onClick={()=>setRole("CLIENT")}>🎓 Student</button>
          <button style={{...C.tab,...(!isClient?C.tabAD:C.tabI)}} onClick={()=>setRole("WRITER")}>✍️ Staff</button>
        </div>

        <div style={C.card}>
          {/* Staff role selector */}
          {!isClient && (
            <div style={C.fg}>
              <label style={C.lbl}>Role</label>
              <select style={C.sel} value={role} onChange={e=>setRole(e.target.value as any)}>
                <option value="WRITER">Writer</option>
                <option value="ANALYST">Analyst</option>
                <option value="QC">Quality Control</option>
              </select>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={C.fg}>
              <label style={C.lbl}>Full Name</label>
              <input style={C.inp} value={name} onChange={e=>setName(e.target.value)} required placeholder="Your full name" />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Phone Number</label>
              <input style={C.inp} value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="08012345678" />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Email Address</label>
              <input style={C.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@email.com" />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Password</label>
              <input style={C.inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Min. 8 characters" />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Confirm Password</label>
              <input style={C.inp} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Re-enter password" />
            </div>

            {error && <p style={C.err}>{error}</p>}

            <button type="submit" disabled={loading} style={{...C.btn,...(isClient?C.btnS:C.btnD),opacity:loading?.7:1}}>
              {loading ? "Creating..." : isClient ? "Create Account →" : "Submit Application →"}
            </button>
          </form>

          <div style={C.foot}>
            Already have an account?{" "}
            <button style={C.flink} onClick={()=>router.push("/login")}>Sign in</button>
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
