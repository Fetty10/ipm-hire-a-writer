"use client";
export const dynamic = "force-dynamic";
import { Suspense, useState, useRef } from "react";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import { PublicNav } from "@/components/PublicNav";
import { HireForm } from "@/app/student/hire/HireForm";
import toast from "react-hot-toast";

const C = {
  page:    { minHeight:"100vh", background:"#F0F9FF", fontFamily:"'DM Sans',sans-serif" },
  inner:   { maxWidth:"560px", margin:"0 auto", padding:"2rem 1.5rem" },
  headline:{ textAlign:"center" as const, marginBottom:"1.75rem" },
  h1:      { fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:"#0C1A2E", marginBottom:".35rem" },
  sub:     { fontSize:".85rem", color:"#5B7EA6" },
  // Account section
  acctBox: { background:"#F8FCFF", border:"1.5px solid #BAE6FD", borderRadius:"14px", padding:"1.25rem", marginBottom:"1rem" },
  acctNote:{ fontSize:".78rem", color:"#0369A1", fontWeight:600, marginBottom:"1rem", display:"flex", alignItems:"center", gap:".4rem" },
  fg:      { marginBottom:".75rem" },
  lbl:     { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".35rem" },
  inp:     { width:"100%", padding:".65rem .9rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  inpErr:  { width:"100%", padding:".65rem .9rem", borderRadius:"10px", border:"1.5px solid #FCA5A5", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  row2:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:".6rem" },
  err:     { fontSize:".72rem", color:"#EF4444", fontWeight:600, marginTop:".3rem" },
  hint:    { fontSize:".7rem", color:"#5B7EA6", marginTop:".25rem" },
  foot:    { textAlign:"center" as const, fontSize:".82rem", color:"#5B7EA6", marginTop:"1rem" },
  // Modal
  modal:   { position:"fixed" as const, inset:0, background:"rgba(12,26,46,.6)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" },
  modalBox:{ background:"#fff", borderRadius:"16px", padding:"1.5rem", maxWidth:"420px", width:"100%" },
  btnPrimary:{ width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnDisabled:{ opacity:.5, cursor:"not-allowed" as const },
};

function RegisterAndOrder() {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [checking, setChecking] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [showBankModal,  setShowBankModal]  = useState(false);
  const [bankPending,    setBankPending]    = useState(false);
  const [bankDone,       setBankDone]       = useState<any>(null);

  const emailTimer = useRef<any>(null);

  function handleEmailChange(val: string) {
    setEmail(val); setEmailErr("");
    clearTimeout(emailTimer.current);
    if (!val.includes("@")) return;
    emailTimer.current = setTimeout(async () => {
      setChecking(true);
      const res  = await fetch(`/api/auth/register-and-order?email=${encodeURIComponent(val)}`);
      const data = await res.json();
      setChecking(false);
      if (data.exists) setEmailErr("Email already exists. Please sign in instead.");
    }, 600);
  }

  function validateAccount(): string {
    if (!name.trim())         return "Please enter your full name.";
    if (!phone.trim())        return "Please enter your WhatsApp number.";
    if (!email.trim())        return "Please enter your email address.";
    if (emailErr)             return emailErr;
    if (password.length < 8)  return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return "";
  }

  async function handlePayload(orderPayload: any, paymentMethod: "PAYSTACK" | "BANK_TRANSFER" | "FLUTTERWAVE") {
    const err = validateAccount();
    if (err) { toast.error(err); return; }

    const fullPayload = { ...orderPayload, name, email, phone, password, paymentMethod };

    if (paymentMethod === "BANK_TRANSFER") {
      setPendingPayload(fullPayload);
      setShowBankModal(true);
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register-and-order", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(fullPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "EMAIL_EXISTS") {
          setEmailErr("Email already exists. Please sign in instead.");
          toast.error("That email already has an account. Please sign in.");
        } else {
          toast.error(data.error || "Something went wrong. Please try again.");
        }
        return;
      }
      window.location.href = data.paymentUrl;
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function confirmBankTransfer() {
    if (!pendingPayload) return;
    setBankPending(true);
    try {
      const res  = await fetch("/api/auth/register-and-order", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(pendingPayload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Something went wrong.");
        setBankPending(false);
        setShowBankModal(false);
        return;
      }
      setBankDone(data);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setBankPending(false);
      setShowBankModal(false);
    }
  }

  // ── Account fields to inject into HireForm ────────────────
  const accountSection = (
    <div style={C.acctBox}>
      <div style={C.acctNote}>
        👤 Create your account to track your project progress at any time.
      </div>

      <div style={C.fg}>
        <label style={C.lbl}>Full Name <span style={{color:"#EF4444"}}>*</span></label>
        <input style={C.inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
      </div>

      <div style={C.fg}>
        <label style={C.lbl}>WhatsApp Number <span style={{color:"#EF4444"}}>*</span></label>
        <input style={C.inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08012345678" />
        <div style={C.hint}>We'll send order updates here</div>
      </div>

      <div style={C.fg}>
        <label style={C.lbl}>Email Address <span style={{color:"#EF4444"}}>*</span></label>
        <input style={emailErr?C.inpErr:C.inp} type="email" value={email}
          onChange={e=>handleEmailChange(e.target.value)} placeholder="you@email.com" />
        {checking && <div style={{...C.hint,color:"#38BDF8"}}>Checking...</div>}
        {emailErr && (
          <div style={C.err}>
            {emailErr}{" "}<a href="/login" style={{color:"#0369A1",fontWeight:700}}>Sign in →</a>
          </div>
        )}
      </div>

      <div style={C.row2}>
        <div style={C.fg}>
          <label style={C.lbl}>Password <span style={{color:"#EF4444"}}>*</span></label>
          <input style={C.inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 8 characters" />
        </div>
        <div style={C.fg}>
          <label style={C.lbl}>Confirm Password <span style={{color:"#EF4444"}}>*</span></label>
          <input style={C.inp} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter" />
          {confirm && password!==confirm && <div style={C.err}>Passwords do not match.</div>}
        </div>
      </div>

      <div style={C.foot}>
        Already have an account?{" "}
        <a href="/login" style={{color:"#0369A1",fontWeight:700}}>Sign in →</a>
      </div>
    </div>
  );

  return (
    <div style={C.page}>
      <PublicNav />

      <div style={C.inner}>
        <div style={C.headline}>
          <h1 style={C.h1}>Register now to hire an expert writer.</h1>
          <p style={C.sub}>Fill in your order details and pay — your account is created automatically.</p>
        </div>

        <HireForm
          mode="register"
          onPayload={handlePayload}
          accountFields={accountSection}
        />
      </div>

      {/* Bank Transfer Modal */}
      {showBankModal && !bankDone && (
        <div style={C.modal}>
          <div style={C.modalBox}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:800,marginBottom:".75rem"}}>🏦 Bank Transfer</div>
            <p style={{fontSize:".83rem",color:"#5B7EA6",marginBottom:"1rem",lineHeight:1.6}}>
              Click below to create your account and get your unique payment reference. Transfer the exact amount to our account and your order activates once payment is confirmed.
            </p>
            <div style={{display:"flex",gap:".5rem"}}>
              <button disabled={bankPending} onClick={confirmBankTransfer}
                style={{...C.btnPrimary,flex:1,...(bankPending?C.btnDisabled:{})}}>
                {bankPending ? "Processing..." : "Register & Get Reference →"}
              </button>
              <button onClick={()=>{setShowBankModal(false);setPendingPayload(null);}}
                style={{padding:".85rem 1rem",borderRadius:"12px",border:"1.5px solid #BAE6FD",background:"#fff",cursor:"pointer",fontWeight:700,color:"#5B7EA6"}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Success */}
      {bankDone && (
        <div style={C.modal}>
          <div style={C.modalBox}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:800,marginBottom:".75rem",color:"#065F46"}}>✅ Account Created!</div>
            <p style={{fontSize:".83rem",color:"#5B7EA6",marginBottom:".75rem",lineHeight:1.6}}>
              Transfer <strong>₦{bankDone.amountNaira?.toLocaleString()}</strong> to:
            </p>
            {bankDone.bankAccount && (
              <div style={{background:"#F0F9FF",borderRadius:"10px",padding:"1rem",marginBottom:"1rem",fontSize:".83rem",lineHeight:1.8}}>
                <div><strong>Bank:</strong> {bankDone.bankAccount.bankName}</div>
                <div><strong>Account:</strong> {bankDone.bankAccount.accountNumber}</div>
                <div><strong>Name:</strong> {bankDone.bankAccount.accountName}</div>
                <div style={{marginTop:".5rem",fontWeight:700,color:"#0369A1"}}>
                  <strong>Reference:</strong> {bankDone.reference}
                </div>
              </div>
            )}
            <p style={{fontSize:".75rem",color:"#5B7EA6",marginBottom:"1rem"}}>
              Use the reference as your payment description. Your order activates once payment is confirmed.
            </p>
            <a href="/login" style={{...C.btnPrimary,display:"block",textAlign:"center" as const,textDecoration:"none",padding:".85rem"}}>
              Go to Login →
            </a>
          </div>
        </div>
      )}

      <WhatsAppWidget message="Hi Lina, I need help placing an order on iProjectMaster." />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#5B7EA6"}}>Loading...</div>}>
      <RegisterAndOrder />
    </Suspense>
  );
}
