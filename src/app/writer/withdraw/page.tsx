"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";

const NAV = [
  { label:"Dashboard",    icon:"📊", href:"/writer/dashboard" },
  { label:"Pending Jobs", icon:"📋", href:"/writer/jobs/pending" },
  { label:"Active Jobs",  icon:"✍️", href:"/writer/jobs/active" },
  { label:"Delivered",    icon:"✅", href:"/writer/jobs/delivered" },
  { label:"Earnings",     icon:"💰", href:"/writer/earnings" },
  { label:"Withdraw",     icon:"🏦", href:"/writer/withdraw" },
  { label:"Notifications",icon:"🔔", href:"/writer/notifications" },
  { label:"Profile",      icon:"👤", href:"/writer/profile" },
];

const BANKS = ["GT Bank","First Bank","Access Bank","UBA","Zenith Bank","Fidelity Bank","Sterling Bank","Wema Bank","Polaris Bank","Union Bank","Ecobank","Keystone Bank","Stanbic IBTC"];

const C = {
  page:  { maxWidth:"520px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  balBox:{ background:"#0C1A2E", borderRadius:"20px", padding:"1.5rem", color:"#fff", marginBottom:"1.5rem", position:"relative" as const, overflow:"hidden" },
  balLbl:{ fontSize:".68rem", color:"#7DD3FC", textTransform:"uppercase" as const, letterSpacing:".08em", fontWeight:700, marginBottom:".3rem" },
  balVal:{ fontFamily:"'Syne',sans-serif", fontSize:"2.5rem", fontWeight:800, color:"#fff" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.5rem", marginBottom:"1rem" },
  ctitle:{ fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1.25rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  sel:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, background:"#fff" },
  notice:{ background:"#FEF9C3", border:"1px solid #FDE68A", borderRadius:"10px", padding:".75rem 1rem", fontSize:".78rem", color:"#854D0E", marginBottom:"1rem" },
  btnP:  { width:"100%", padding:".85rem", borderRadius:"12px", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { opacity:.5, cursor:"not-allowed" as const },
  success:{ textAlign:"center" as const, padding:"2rem" },
  sicon: { fontSize:"2.5rem", marginBottom:"1rem" },
  stitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#0C1A2E", marginBottom:".5rem" },
  ssub:  { fontSize:".83rem", color:"#5B7EA6", lineHeight:1.6 },
  prevCard:{ background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem" },
  prevRow:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:".5rem 0", borderBottom:"1px solid #F0F9FF" },
  prevName:{ fontSize:".82rem", fontWeight:700, color:"#0C1A2E" },
  prevMeta:{ fontSize:".72rem", color:"#5B7EA6" },
  badge: { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700 },
};

export default function WriterWithdraw() {
  const { data: session } = useSession();
  const [available, setAvailable]   = useState(0);
  const [prevWds,   setPrevWds]     = useState<any[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [submitting,setSubmitting]  = useState(false);
  const [success,   setSuccess]     = useState(false);
  const [bankName,  setBankName]    = useState("");
  const [accNum,    setAccNum]      = useState("");
  const [accName,   setAccName]     = useState("");
  const [amount,    setAmount]      = useState("");
  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"WR";

  useEffect(()=>{
    fetch("/api/staff/earnings").then(r=>r.json()).then(d=>{
      if(d.success){ setAvailable(d.data.summary.available||0); setPrevWds((d.data.pendingWithdrawals||[]).map((w:any)=>({...w,amountNaira:w.amountKobo/100}))); }
      setLoading(false);
    });
  },[]);

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if(!bankName) { alert("Select a bank."); return; }
    if(accNum.length!==10) { alert("Account number must be 10 digits."); return; }
    if(!accName.trim()) { alert("Enter account name."); return; }
    if(isNaN(amt)||amt<1000) { alert("Minimum withdrawal is ₦1,000."); return; }
    if(amt>available) { alert(`Max is ₦${available.toLocaleString()}`); return; }
    setSubmitting(true);
    const res  = await fetch("/api/withdrawals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amountKobo:Math.round(amt*100),bankName,accountNumber:accNum,accountName:accName})});
    const data = await res.json();
    if(res.ok) setSuccess(true); else alert(data.error);
    setSubmitting(false);
  }

  return (
    <StaffLayout navItems={NAV} role="Writer" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Request Withdrawal</h1>
        <p style={C.sub}>Withdraw your available balance via Paystack.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <>
            <div style={C.balBox}>
              <div style={{position:"absolute",top:"-20px",right:"-20px",width:"100px",height:"100px",background:"rgba(56,189,248,.1)",borderRadius:"50%"}}/>
              <div style={C.balLbl}>Available Balance</div>
              <div style={C.balVal}>₦{available.toLocaleString()}</div>
            </div>

            {success ? (
              <div style={C.card}>
                <div style={C.success}>
                  <div style={C.sicon}>🎉</div>
                  <div style={C.stitle}>Request Submitted!</div>
                  <div style={C.ssub}>Admin will review and approve. Once approved, Paystack will automatically transfer the funds to your bank account.</div>
                </div>
              </div>
            ) : (
              <div style={C.card}>
                <div style={C.ctitle}>Bank Details</div>
                <form onSubmit={submit}>
                  <div style={C.fg}>
                    <label style={C.lbl}>Bank Name</label>
                    <select style={C.sel} value={bankName} onChange={e=>setBankName(e.target.value)}>
                      <option value="">Select your bank</option>
                      {BANKS.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div style={C.fg}>
                    <label style={C.lbl}>Account Number</label>
                    <input style={C.inp} value={accNum} onChange={e=>setAccNum(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit NUBAN" />
                  </div>
                  <div style={C.fg}>
                    <label style={C.lbl}>Account Name</label>
                    <input style={C.inp} value={accName} onChange={e=>setAccName(e.target.value)} placeholder="As it appears on your bank account" />
                  </div>
                  <div style={C.fg}>
                    <label style={C.lbl}>Amount to Withdraw (₦)</label>
                    <input style={C.inp} type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`Min ₦1,000 · Max ₦${available.toLocaleString()}`} />
                  </div>
                  <div style={C.notice}>⏱ Admin must approve before Paystack auto-transfers to your account.</div>
                  <button type="submit" style={{...C.btnP,...(available<1000?C.btnD:{})}} disabled={submitting||available<1000}>
                    {submitting?"Submitting...":"Submit Withdrawal Request →"}
                  </button>
                  {available<1000&&<p style={{textAlign:"center" as const,fontSize:".75rem",color:"#EF4444",marginTop:".5rem"}}>Minimum withdrawal is ₦1,000.</p>}
                </form>
              </div>
            )}

            {prevWds.length>0 && (
              <div style={C.prevCard}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:".85rem",fontWeight:700,color:"#0C1A2E",marginBottom:"1rem"}}>Recent Requests</div>
                {prevWds.map((w:any)=>(
                  <div key={w.id} style={C.prevRow}>
                    <div>
                      <div style={C.prevName}>₦{w.amountNaira.toLocaleString()}</div>
                      <div style={C.prevMeta}>{w.bankName} · {new Date(w.requestedAt).toLocaleDateString("en-NG")}</div>
                    </div>
                    <span style={{...C.badge,...(w.status==="PAID"?{background:"#D1FAE5",color:"#065F46"}:w.status==="PENDING"?{background:"#FEF9C3",color:"#854D0E"}:{background:"#E0F2FE",color:"#0369A1"})}}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </StaffLayout>
  );
}
