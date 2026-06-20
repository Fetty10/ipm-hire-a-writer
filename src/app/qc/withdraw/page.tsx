"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";

const NAV = [
  { label:"Dashboard",    icon:"📊", href:"/qc/dashboard" },
  { label:"Pending Jobs", icon:"📋", href:"/qc/jobs/pending" },
  { label:"Active Jobs",  icon:"✍️", href:"/qc/jobs/active" },
  { label:"Delivered",    icon:"✅", href:"/qc/jobs/delivered" },
  { label:"Earnings",     icon:"💰", href:"/qc/earnings" },
  { label:"Withdraw",     icon:"🏦", href:"/qc/withdraw" },
  { label:"Notifications",icon:"🔔", href:"/qc/notifications" },
  { label:"Profile",      icon:"👤", href:"/qc/profile" },
];

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
  resolved:{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:"10px", padding:".75rem 1rem", fontSize:".82rem", color:"#166534", marginBottom:"1rem", fontWeight:700 },
  resolving:{ fontSize:".78rem", color:"#5B7EA6", marginTop:".4rem" },
  saveRow:{ display:"flex", alignItems:"center", gap:".5rem", marginBottom:"1rem" },
  saveLbl:{ fontSize:".8rem", color:"#0C1A2E", cursor:"pointer" },
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
  savedBox:{ background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:"12px", padding:"1rem", marginBottom:"1rem" },
  savedTxt:{ fontSize:".82rem", color:"#0C1A2E", fontWeight:700 },
  savedSub:{ fontSize:".72rem", color:"#5B7EA6", marginTop:".2rem" },
  useOther:{ background:"none", border:"none", color:"#38BDF8", fontSize:".78rem", fontWeight:700, cursor:"pointer", marginTop:".5rem" },
};

export default function QcWithdraw() {
  const { data: session } = useSession();
  const [available,  setAvailable]  = useState(0);
  const [prevWds,    setPrevWds]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);

  const [banks,       setBanks]       = useState<{name:string,code:string}[]>([]);
  const [bankCode,     setBankCode]   = useState("");
  const [bankName,    setBankName]    = useState("");
  const [accNum,      setAccNum]      = useState("");
  const [accName,     setAccName]     = useState("");
  const [amount,      setAmount]      = useState("");
  const [resolving,   setResolving]   = useState(false);
  const [resolved,    setResolved]    = useState(false);
  const [saveDetails, setSaveDetails] = useState(true);
  const [savedBank,   setSavedBank]   = useState<any>(null);
  const [useNewBank,  setUseNewBank]  = useState(false);
  const [wdPage,      setWdPage]      = useState(1);
  const [wdPages,     setWdPages]     = useState(1);
  const [wdTotal,      setWdTotal]    = useState(0);

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";

  useEffect(()=>{
    Promise.all([
      fetch("/api/staff/earnings").then(r=>r.json()),
      fetch(`/api/staff/withdrawals?page=${wdPage}`).then(r=>r.json()),
      fetch("/api/banks").then(r=>r.json()),
      fetch("/api/staff/bank-details").then(r=>r.json()),
    ]).then(([earningsRes, withdrawalsRes, banksRes, bankDetailsRes]) => {
      if (earningsRes.success) {
        setAvailable((earningsRes.data.summary.availableKobo||0)/100);
      }
      if (withdrawalsRes.success) {
        setPrevWds(withdrawalsRes.data||[]);
        setWdTotal(withdrawalsRes.total||0);
        setWdPages(withdrawalsRes.pages||1);
      }
      if (banksRes.success) setBanks(banksRes.data);
      if (bankDetailsRes.success && bankDetailsRes.data?.accountNumber) {
        setSavedBank(bankDetailsRes.data);
      } else {
        setUseNewBank(true);
      }
      setLoading(false);
    });
  },[]);

  useEffect(() => {
    if (wdPage === 1) return; // already loaded on mount
    fetch(`/api/staff/withdrawals?page=${wdPage}`).then(r=>r.json()).then(d=>{
      if (d.success) { setPrevWds(d.data||[]); setWdTotal(d.total||0); setWdPages(d.pages||1); }
    });
  }, [wdPage]);

  // Auto-resolve account name when bank + 10-digit account number entered
  useEffect(() => {
    if (bankCode && accNum.length === 10) {
      setResolving(true);
      setResolved(false);
      setAccName("");
      fetch("/api/banks/resolve", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ accountNumber: accNum, bankCode }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.success) { setAccName(d.accountName); setResolved(true); }
          else { toast.error(d.error || "Could not verify account."); }
        })
        .finally(() => setResolving(false));
    }
  }, [bankCode, accNum]);

  function selectBank(code: string) {
    setBankCode(code);
    setBankName(banks.find(b => b.code === code)?.name || "");
    setResolved(false);
    setAccName("");
  }

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);

    const finalBankName = useNewBank ? bankName : savedBank?.bankName;
    const finalAccNum   = useNewBank ? accNum   : savedBank?.accountNumber;
    const finalAccName  = useNewBank ? accName  : savedBank?.accountName;
    const finalBankCode = useNewBank ? bankCode : savedBank?.bankCode;

    if(!finalBankName) { toast.error("Select a bank."); return; }
    if(!finalAccNum || finalAccNum.length!==10) { toast.error("Account number must be 10 digits."); return; }
    if(!finalAccName?.trim()) { toast.error("Account name could not be verified."); return; }
    if(isNaN(amt)||amt<1000) { toast.error("Minimum withdrawal is ₦1,000."); return; }
    if(amt>available) { toast.error(`Max is ₦${available.toLocaleString()}`); return; }

    setSubmitting(true);

    // Save bank details for future use if requested
    if (useNewBank && saveDetails) {
      await fetch("/api/staff/bank-details", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ bankName: finalBankName, bankCode: finalBankCode, accountNumber: finalAccNum, accountName: finalAccName }),
      });
    }

    const res  = await fetch("/api/withdrawals",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amountKobo:Math.round(amt*100),bankName:finalBankName,accountNumber:finalAccNum,accountName:finalAccName})});
    const data = await res.json();
    if(res.ok) setSuccess(true); else toast.error(data.error || "Something went wrong");
    setSubmitting(false);
  }

  const canSubmit = useNewBank
    ? (resolved && accName && amount)
    : (savedBank?.accountNumber && amount);

  return (
    <StaffLayout navItems={NAV} role="Quality Control" initials={initials}>
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
                  <div style={C.stitle}>Withdrawal Requested!</div>
                  <p style={C.ssub}>Your request is pending admin approval. Once approved, funds will be sent to your account via Paystack automatically.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} style={C.card}>
                <div style={C.ctitle}>Withdrawal Details</div>

                {/* Saved bank shortcut */}
                {savedBank?.accountNumber && !useNewBank && (
                  <div style={C.savedBox}>
                    <div style={C.savedTxt}>🏦 {savedBank.accountName}</div>
                    <div style={C.savedSub}>{savedBank.bankName} · {savedBank.accountNumber}</div>
                    <button type="button" style={C.useOther} onClick={()=>setUseNewBank(true)}>
                      Use a different account →
                    </button>
                  </div>
                )}

                {useNewBank && (
                  <>
                    <div style={C.fg}>
                      <label style={C.lbl}>Bank</label>
                      <select style={C.sel} value={bankCode} onChange={e=>selectBank(e.target.value)}>
                        <option value="">Select your bank</option>
                        {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                      </select>
                    </div>

                    <div style={C.fg}>
                      <label style={C.lbl}>Account Number</label>
                      <input style={C.inp} value={accNum} maxLength={10}
                        onChange={e=>setAccNum(e.target.value.replace(/\D/g,""))}
                        placeholder="10-digit account number" />
                      {resolving && <div style={C.resolving}>🔍 Verifying account...</div>}
                    </div>

                    {resolved && accName && (
                      <div style={C.resolved}>✅ {accName}</div>
                    )}

                    {savedBank?.accountNumber && (
                      <button type="button" style={C.useOther} onClick={()=>setUseNewBank(false)}>
                        ← Use saved account instead
                      </button>
                    )}

                    <div style={C.saveRow}>
                      <input type="checkbox" id="saveDetails" checked={saveDetails} onChange={e=>setSaveDetails(e.target.checked)} />
                      <label htmlFor="saveDetails" style={C.saveLbl}>Save these details for future withdrawals</label>
                    </div>
                  </>
                )}

                <div style={C.fg}>
                  <label style={C.lbl}>Amount (₦)</label>
                  <input style={C.inp} type="number" min="1000" max={available} value={amount}
                    onChange={e=>setAmount(e.target.value)} placeholder="e.g. 5000" />
                </div>

                <div style={C.notice}>⚠️ Minimum withdrawal is ₦1,000. Admin approval required before transfer.</div>

                <button type="submit" style={{...C.btnP,...((!canSubmit||submitting)?C.btnD:{})}} disabled={!canSubmit||submitting}>
                  {submitting ? "Processing..." : "Request Withdrawal →"}
                </button>
              </form>
            )}

            {prevWds.length > 0 && (
              <div style={C.prevCard}>
                <div style={C.ctitle}>Withdrawal History</div>
                {prevWds.map((w:any) => (
                  <div key={w.id} style={C.prevRow}>
                    <div>
                      <div style={C.prevName}>₦{(w.amountKobo/100).toLocaleString()}</div>
                      <div style={C.prevMeta}>
                        {w.bankName} · {w.accountNumber}
                      </div>
                      <div style={C.prevMeta}>
                        Requested {new Date(w.requestedAt).toLocaleString("en-NG",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
                        {w.processedAt && <> · Processed {new Date(w.processedAt).toLocaleString("en-NG",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</>}
                      </div>
                    </div>
                    <span style={{...C.badge,
                      background: w.status==="PAID"?"#D1FAE5":w.status==="APPROVED"?"#DBEAFE":w.status==="REJECTED"?"#FEE2E2":"#FEF9C3",
                      color:      w.status==="PAID"?"#065F46":w.status==="APPROVED"?"#1E40AF":w.status==="REJECTED"?"#991B1B":"#854D0E",
                    }}>{w.status}</span>
                  </div>
                ))}
                {wdPages > 1 && (
                  <div style={{display:"flex",gap:".4rem",justifyContent:"center",marginTop:"1rem",flexWrap:"wrap" as const}}>
                    <button style={{padding:".35rem .7rem",borderRadius:"7px",border:"1.5px solid #BAE6FD",fontSize:".75rem",fontWeight:700,cursor:wdPage===1?"not-allowed":"pointer",opacity:wdPage===1?.4:1,background:"#fff",color:"#0C1A2E"}}
                      disabled={wdPage===1} onClick={()=>setWdPage(p=>p-1)}>← Prev</button>
                    {Array.from({length:wdPages},(_,i)=>i+1).map(p=>(
                      <button key={p} style={{padding:".35rem .7rem",borderRadius:"7px",fontSize:".75rem",fontWeight:700,cursor:"pointer",border:"1.5px solid",
                        background:p===wdPage?"#0C1A2E":"#fff",color:p===wdPage?"#38BDF8":"#0C1A2E",borderColor:p===wdPage?"#0C1A2E":"#BAE6FD"}}
                        onClick={()=>setWdPage(p)}>{p}</button>
                    ))}
                    <button style={{padding:".35rem .7rem",borderRadius:"7px",border:"1.5px solid #BAE6FD",fontSize:".75rem",fontWeight:700,cursor:wdPage===wdPages?"not-allowed":"pointer",opacity:wdPage===wdPages?.4:1,background:"#fff",color:"#0C1A2E"}}
                      disabled={wdPage===wdPages} onClick={()=>setWdPage(p=>p+1)}>Next →</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </StaffLayout>
  );
}
