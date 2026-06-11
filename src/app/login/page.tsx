"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<"student"|"staff">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

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
    router.push(tab === "student" ? "/student/dashboard" : "/writer/dashboard");
  }

  return (
    <div style={{minHeight:"100vh",background:"#F0F9FF",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:"100%",maxWidth:"420px"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{fontSize:"1.8rem",fontWeight:"800",color:"#0C1A2E",fontFamily:"'Syne',sans-serif"}}>
            iProject<span style={{color:"#38BDF8"}}>Master</span>
          </div>
          <p style={{fontSize:".85rem",color:"#5B7EA6",marginTop:".3rem"}}>Hire a Writer Platform</p>
        </div>

        {/* Tab switcher */}
        <div style={{display:"flex",borderRadius:"12px",overflow:"hidden",border:"1.5px solid #BAE6FD",marginBottom:"1.5rem"}}>
          <button onClick={() => setTab("student")} style={{flex:1,padding:".75rem",fontSize:".82rem",fontWeight:"700",cursor:"pointer",border:"none",background:tab==="student"?"#38BDF8":"#fff",color:tab==="student"?"#0C1A2E":"#5B7EA6",transition:"all .2s"}}>
            🎓 Student Login
          </button>
          <button onClick={() => setTab("staff")} style={{flex:1,padding:".75rem",fontSize:".82rem",fontWeight:"700",cursor:"pointer",border:"none",background:tab==="staff"?"#0C1A2E":"#fff",color:tab==="staff"?"#38BDF8":"#5B7EA6",transition:"all .2s"}}>
            👤 Staff Login
          </button>
        </div>

        {/* Card */}
        <div style={{background:"#fff",borderRadius:"20px",border:"1.5px solid #E0F2FE",boxShadow:"0 4px 24px rgba(14,165,233,.08)",padding:"1.75rem"}}>
          <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
            <div>
              <label style={{fontSize:".72rem",fontWeight:"700",textTransform:"uppercase",letterSpacing:".08em",color:"#0C1A2E",display:"block",marginBottom:".5rem"}}>Email or Phone</label>
              <input type="text" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@email.com or 08012345678"
                style={{width:"100%",padding:".75rem 1rem",borderRadius:"12px",border:"1.5px solid #BAE6FD",fontSize:".85rem",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"}} />
            </div>
            <div>
              <label style={{fontSize:".72rem",fontWeight:"700",textTransform:"uppercase",letterSpacing:".08em",color:"#0C1A2E",display:"block",marginBottom:".5rem"}}>Password</label>
              <div style={{position:"relative"}}>
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"
                  style={{width:"100%",padding:".75rem 2.5rem .75rem 1rem",borderRadius:"12px",border:"1.5px solid #BAE6FD",fontSize:".85rem",outline:"none",fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"}} />
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"1rem"}}>
                  {showPw?"🙈":"👁"}
                </button>
              </div>
            </div>
            {error && <p style={{fontSize:".78rem",color:"#EF4444",fontWeight:"600",margin:"-.25rem 0"}}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{width:"100%",padding:".85rem",borderRadius:"12px",border:"none",background:tab==="student"?"#38BDF8":"#0C1A2E",color:tab==="student"?"#0C1A2E":"#38BDF8",fontWeight:"700",fontSize:".88rem",cursor:"pointer",opacity:loading?.6:1,fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
          <div style={{marginTop:"1.25rem",textAlign:"center"}}>
            <p style={{fontSize:".78rem",color:"#5B7EA6"}}>
              New student?{" "}
              <button onClick={()=>router.push("/register")} style={{background:"none",border:"none",color:"#0369A1",fontWeight:"700",cursor:"pointer",fontSize:".78rem"}}>
                Create account
              </button>
            </p>
            {tab==="staff" && (
              <p style={{fontSize:".78rem",color:"#5B7EA6",marginTop:".4rem"}}>
                Want to join as staff?{" "}
                <button onClick={()=>router.push("/register?role=staff")} style={{background:"none",border:"none",color:"#0369A1",fontWeight:"700",cursor:"pointer",fontSize:".78rem"}}>
                  Apply here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
