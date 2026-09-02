"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:  { maxWidth:"900px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  tabs:  { display:"flex", gap:".5rem", marginBottom:"1.5rem" },
  tab:   { padding:".55rem 1.25rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontWeight:700, cursor:"pointer", background:"#fff", color:"#5B7EA6" },
  tabA:  { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem", marginBottom:"1rem" },
  head:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  name:  { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  meta:  { fontSize:".78rem", color:"#5B7EA6", marginTop:".25rem" },
  amt:   { fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:"#0284C7", flexShrink:0 as const },
  info:  { background:"#E0F2FE", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".78rem" },
  row:   { display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:".82rem", marginBottom:".3rem" },
  rlbl:  { color:"#5B7EA6" },
  rval:  { fontWeight:600, color:"#0C1A2E" },
  btns:  { display:"flex", gap:".5rem", flexWrap:"wrap" as const },
  btnG:  { padding:".6rem 1.4rem", borderRadius:"10px", background:"#D1FAE5", color:"#065F46", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnR:  { padding:".6rem 1.1rem", borderRadius:"10px", background:"#FEE2E2", color:"#991B1B", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  strow: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:"1rem", alignItems:"center", padding:".85rem 1.25rem", borderBottom:"1px solid #F0F9FF", fontSize:".82rem" },
  sthdr: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:"1rem", padding:".6rem 1.25rem", background:"#F0F9FF", fontSize:".72rem", fontWeight:700, color:"#5B7EA6", textTransform:"uppercase" as const, letterSpacing:".06em", borderRadius:"12px 12px 0 0" },
  // Pay modal
  overlay:{ position:"fixed" as const, inset:0, background:"rgba(12,26,46,.6)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" },
  modal:  { background:"#fff", borderRadius:"20px", padding:"1.75rem", maxWidth:"440px", width:"100%" },
  mh1:    { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1.25rem" },
  fg:     { marginBottom:"1rem" },
  lbl:    { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:    { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  btnS:   { width:"100%", padding:".75rem", borderRadius:"12px", border:"none", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, cursor:"pointer" },
};

export default function AdminWithdrawals() {
  const [tab,       setTab]       = useState<"pending"|"staff">("pending");
  const [pending,   setPending]   = useState<any[]>([]);
  const [staff,     setStaff]     = useState<any[]>([]);
  const [summary,   setSummary]   = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [acting,    setActing]    = useState<string|null>(null);
  const [payModal,  setPayModal]  = useState<any|null>(null); // staff to pay directly
  const [payAmount, setPayAmount] = useState("");
  const [paying,    setPaying]    = useState(false);

  async function load() {
    setLoading(true);
    const [overviewRes, earningsRes, staffRes] = await Promise.all([
      fetch("/api/admin/overview"),
      fetch("/api/admin/earnings-summary"),
      fetch("/api/admin/staff?filter=active&role=all"),
    ]);
    const overviewData = await overviewRes.json();
    if (overviewData.success) setPending(overviewData.data.pendingWds||[]);
    if (earningsRes.ok) {
      const d = await earningsRes.json();
      if (d.success) setSummary(d.data);
    }
    if (staffRes.ok) {
      const d = await staffRes.json();
      if (d.success) setStaff(d.data||[]);
    }
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  // Mark a withdrawal request as paid
  async function handleMarkPaid(withdrawalId: string) {
    setActing(withdrawalId);
    const res  = await fetch("/api/withdrawals", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ withdrawalId, action:"mark_paid" }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Marked as paid. Earnings updated."); load(); }
    else toast.error(data.error || "Something went wrong");
    setActing(null);
  }

  async function handleDecline(withdrawalId: string) {
    setActing(withdrawalId+"D");
    const res  = await fetch("/api/withdrawals", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ withdrawalId, action:"decline" }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Withdrawal declined."); load(); }
    else toast.error(data.error || "Something went wrong");
    setActing(null);
  }

  // Pay staff directly (no withdrawal request)
  async function handleDirectPay() {
    if (!payModal || !payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
      toast.error("Enter a valid amount."); return;
    }
    setPaying(true);
    const res  = await fetch("/api/admin/direct-pay", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ staffId: payModal.id, amountNaira: Number(payAmount) }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`₦${Number(payAmount).toLocaleString()} marked as paid to ${payModal.name}.`);
      setPayModal(null); setPayAmount(""); load();
    } else toast.error(data.error || "Something went wrong");
    setPaying(false);
  }

  return (
    <AdminLayout badges={{"/admin/withdrawals":pending.length}}>
      <div style={C.page}>
        <h1 style={C.h1}>Staff Payments</h1>
        <p style={C.sub}>Manually transfer to staff bank accounts, then mark as paid here.</p>

        {/* Earnings Summary */}
        {summary && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:".75rem",marginBottom:"1.5rem"}}>
            {[
              {label:"Total Earned",    val:summary.totalKobo,     color:"#0C1A2E"},
              {label:"Available",       val:summary.availableKobo, color:"#0284C7"},
              {label:"Total Withdrawn", val:summary.withdrawnKobo, color:"#16A34A"},
              {label:"Pending Requests",val:summary.pendingWithdrawKobo, color:"#D97706"},
            ].map(s=>(
              <div key={s.label} style={{background:"#fff",borderRadius:"14px",border:"1.5px solid #E0F2FE",padding:"1rem",textAlign:"center" as const}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1.1rem",fontWeight:800,color:s.color}}>
                  ₦{((s.val||0)/100).toLocaleString()}
                </div>
                <div style={{fontSize:".72rem",color:"#5B7EA6",marginTop:"3px",fontWeight:600}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={C.tabs}>
          <button style={{...C.tab,...(tab==="pending"?C.tabA:{})}} onClick={()=>setTab("pending")}>
            ⏳ Withdrawal Requests {pending.length>0?`(${pending.length})`:""}
          </button>
          <button style={{...C.tab,...(tab==="staff"?C.tabA:{})}} onClick={()=>setTab("staff")}>
            👤 Pay Staff Directly
          </button>
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <>
            {/* Pending withdrawal requests */}
            {tab === "pending" && (
              pending.length === 0 ? (
                <div style={C.empty}>
                  <div style={{fontSize:"2.5rem",marginBottom:".75rem"}}>✅</div>
                  <div style={C.etitle}>No pending withdrawal requests.</div>
                </div>
              ) : pending.map((w:any) => (
                <div key={w.id} style={C.card}>
                  <div style={C.head}>
                    <div>
                      <div style={C.name}>{w.staffName} <span style={{fontWeight:400,fontSize:".78rem",color:"#5B7EA6"}}>({w.staffRole})</span></div>
                      <div style={C.meta}>Requested: {new Date(w.requestedAt).toLocaleDateString("en-NG")}</div>
                    </div>
                    <div style={C.amt}>₦{(w.amountNaira||0).toLocaleString()}</div>
                  </div>
                  <div style={C.info}>
                    {[
                      {label:"Bank",           val:w.bankName},
                      {label:"Account Number", val:w.accountNumber},
                      {label:"Account Name",   val:w.accountName},
                    ].map(r=>(
                      <div key={r.label} style={C.row}>
                        <span style={C.rlbl}>{r.label}</span>
                        <span style={C.rval}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={C.btns}>
                    <button style={C.btnG} disabled={!!acting} onClick={()=>handleMarkPaid(w.id)}>
                      {acting===w.id ? "Updating..." : "✓ I've Paid — Mark as Paid"}
                    </button>
                    <button style={C.btnR} disabled={!!acting} onClick={()=>handleDecline(w.id)}>
                      {acting===w.id+"D" ? "..." : "✕ Decline"}
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Pay staff directly */}
            {tab === "staff" && (
              <div style={{background:"#fff",borderRadius:"16px",border:"1.5px solid #E0F2FE",overflow:"hidden"}}>
                <div style={C.sthdr}>
                  <span>Name</span><span>Role</span><span>Available Balance</span><span>Action</span>
                </div>
                {staff.filter((s:any) => ["WRITER","ANALYST","QC"].includes(s.role)).map((s:any) => (
                  <div key={s.id} style={C.strow}>
                    <div>
                      <div style={{fontWeight:600,color:"#0C1A2E",fontSize:".83rem"}}>{s.name}</div>
                      <div style={{fontSize:".72rem",color:"#5B7EA6"}}>{s.phone}</div>
                    </div>
                    <span style={{fontSize:".78rem",color:"#5B7EA6"}}>{s.role}</span>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:"#0284C7"}}>
                      ₦{(s.availableNaira||0).toLocaleString()}
                    </div>
                    <button
                      onClick={()=>{ setPayModal(s); setPayAmount(String(s.availableNaira||"")); }}
                      style={{padding:".4rem .9rem",borderRadius:"8px",background:"#D1FAE5",color:"#065F46",border:"none",cursor:"pointer",fontSize:".75rem",fontWeight:700,whiteSpace:"nowrap" as const}}>
                      💸 Pay
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Direct Pay Modal */}
      {payModal && (
        <div style={C.overlay} onClick={e=>{if(e.target===e.currentTarget){setPayModal(null);setPayAmount("");}}}>
          <div style={C.modal}>
            <div style={C.mh1}>💸 Pay {payModal.name}</div>

            <div style={{...C.info, marginBottom:"1.25rem"}}>
              {payModal.bankName && (
                <>
                  <div style={C.row}><span style={C.rlbl}>Bank</span><span style={C.rval}>{payModal.bankName}</span></div>
                  <div style={C.row}><span style={C.rlbl}>Account</span><span style={C.rval}>{payModal.accountNumber}</span></div>
                  <div style={C.row}><span style={C.rlbl}>Name</span><span style={C.rval}>{payModal.accountName}</span></div>
                </>
              )}
              {!payModal.bankName && (
                <div style={{color:"#92400E",fontSize:".78rem"}}>⚠ No bank details on file. Staff must update their bank details first.</div>
              )}
              <div style={{...C.row, marginTop:".5rem"}}>
                <span style={C.rlbl}>Available Balance</span>
                <span style={{...C.rval, color:"#0284C7"}}>₦{(payModal.availableNaira||0).toLocaleString()}</span>
              </div>
            </div>

            <div style={C.fg}>
              <label style={C.lbl}>Amount to Pay (₦)</label>
              <input style={C.inp} type="number" value={payAmount}
                onChange={e=>setPayAmount(e.target.value)}
                placeholder="Enter amount..." />
              <div style={{fontSize:".72rem",color:"#5B7EA6",marginTop:".3rem"}}>
                Transfer this amount to their bank account first, then click confirm.
              </div>
            </div>

            <button style={{...C.btnS,...(paying?{opacity:.6,cursor:"not-allowed" as const}:{})}}
              disabled={paying} onClick={handleDirectPay}>
              {paying ? "Updating..." : "✓ I've Transferred — Confirm Payment"}
            </button>

            <button onClick={()=>{setPayModal(null);setPayAmount("");}}
              style={{width:"100%",marginTop:".75rem",padding:".65rem",borderRadius:"12px",border:"1.5px solid #BAE6FD",background:"#fff",cursor:"pointer",fontSize:".82rem",fontWeight:700,color:"#5B7EA6"}}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
