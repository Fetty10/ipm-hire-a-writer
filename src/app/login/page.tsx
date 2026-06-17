"use client";
export const dynamic = "force-dynamic";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

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
    <div style={{ minHeight:"100vh", background:"#F0F9FF", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"420px" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#0C1A2E" }}>
            iProject<span style={{ color:"#38BDF8" }}>Master</span>
          </div>
          <div style={{ fontSize:".85rem", color:"#5B7EA6", marginTop:".3rem" }}>Student Portal</div>
        </div>

        <div style={{ background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", boxShadow:"0 4px 24px rgba(14,165,233,.08)", padding:"2rem" }}>

          {errMsg && (
            <div style={{ background:"#FEF9C3", border:"1px solid #FDE68A", borderRadius:"10px", padding:".75rem 1rem", fontSize:".78rem", color:"#92400E", marginBottom:"1rem", lineHeight:1.5 }}>
              ⚠️ {errMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:"1.25rem" }}>
              <label style={{ fontSize:".68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#5B7EA6", display:"block", marginBottom:".4rem" }}>Email Address</label>
              <input type="email" required placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", outline:"none", boxSizing:"border-box", background:"#fff" }} />
            </div>

            <div style={{ marginBottom:"1rem" }}>
              <label style={{ fontSize:".68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", color:"#5B7EA6", display:"block", marginBottom:".4rem" }}>Password</label>
              <div style={{ position:"relative" }}>
                <input type={showPw ? "text" : "password"} required placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", outline:"none", boxSizing:"border-box", background:"#fff" }} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"1rem" }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <div style={{ textAlign:"right", marginBottom:"1.25rem" }}>
              <button type="button" onClick={() => router.push("/forgot-password")}
                style={{ background:"none", border:"none", color:"#38BDF8", fontSize:".78rem", fontWeight:600, cursor:"pointer" }}>
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, marginBottom:"1rem" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <div style={{ borderTop:"1px solid #E0F2FE", margin:"1.25rem 0" }} />
          <div style={{ textAlign:"center", fontSize:".82rem", color:"#5B7EA6" }}>
            <p>New here?{" "}
              <button onClick={() => router.push("/register")}
                style={{ background:"none", border:"none", color:"#38BDF8", fontWeight:700, cursor:"pointer", fontSize:".82rem" }}>
                Create an account →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#5B7EA6" }}>Loading...</div>}>
      <StudentLoginForm />
    </Suspense>
  );
}
