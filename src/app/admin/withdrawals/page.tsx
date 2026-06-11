"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:  { maxWidth:"760px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  head:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  name:  { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  meta:  { fontSize:".78rem", color:"#5B7EA6", marginTop:".25rem" },
  amt:   { fontFamily:"'Syne',sans-serif", fontSize:"1.5rem", fontWeight:800, color:"#0284C7", flexShrink:0 as const },
  info:  { background:"#E0F2FE", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".78rem" },
  row:   { display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:".82rem", marginBottom:".3rem" },
  rlbl:  { color:"#5B7EA6" },
  rval:  { fontWeight:600, color:"#0C1A2E" },
  btns:  { display:"flex", gap:".5rem" },
  btnP:  { padding:".6rem 1.4rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnR:  { padding:".6rem 1.1rem", borderRadius:"10px", background:"#FEE2E2", color:"#991B1B", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
};

export default function AdminWithdrawals() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState<string|null>(null);

  async function load() {
    const res  = await fetch("/api/admin/overview");
    const data = await res.json();
    if(data.success) setPending(data.data.pendingWds||[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function handleAction(withdrawalId:string, action:string) {
    setActing(withdrawalId+action);
    const res  = await fetch("/api/withdrawals",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({withdrawalId,action})});
    const data = await res.json();
    if(res.ok){ alert(data.message); setPending(prev=>prev.filter(w=>w.id!==withdrawalId)); }
    else alert(data.error);
    setActing(null);
  }

  return (
    <AdminLayout badges={{"/admin/withdrawals":pending.length}}>
      <div style={C.page}>
        <h1 style={C.h1}>Withdrawal Requests</h1>
        <p style={C.sub}>Approve → Paystack auto-transfers instantly to staff bank account.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : pending.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>✅</div>
            <div style={C.etitle}>No pending withdrawals.</div>
          </div>
        ) : pending.map((w:any)=>(
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
                {label:"Bank",          val:w.bankName},
                {label:"Account Number",val:w.accountNumber},
                {label:"Account Name",  val:w.accountName},
              ].map(r=>(
                <div key={r.label} style={C.row}>
                  <span style={C.rlbl}>{r.label}</span>
                  <span style={C.rval}>{r.val}</span>
                </div>
              ))}
            </div>
            <div style={C.btns}>
              <button style={C.btnP} disabled={!!acting} onClick={()=>handleAction(w.id,"approve")}>
                {acting===w.id+"approve"?"Processing...":"✓ Approve & Pay via Paystack"}
              </button>
              <button style={C.btnR} disabled={!!acting} onClick={()=>handleAction(w.id,"decline")}>
                ✕ Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
