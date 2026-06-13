"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";

const C = {
  page:   { maxWidth:"900px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:    { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  tabs:   { display:"flex", gap:".5rem", marginBottom:"1.5rem" },
  tab:    { padding:".55rem 1.25rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontWeight:700, cursor:"pointer", background:"#fff", color:"#5B7EA6" },
  tabA:   { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  card:   { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden", marginBottom:"1rem" },
  row:    { display:"grid", gridTemplateColumns:"1fr 1fr auto auto", gap:"1rem", alignItems:"center", padding:"1rem 1.25rem", borderBottom:"1px solid #F0F9FF" },
  title:  { fontFamily:"'Syne',sans-serif", fontSize:".85rem", fontWeight:700, color:"#0C1A2E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const },
  meta:   { fontSize:".72rem", color:"#5B7EA6", marginTop:"2px" },
  ref:    { fontSize:".72rem", fontFamily:"monospace", color:"#0369A1", fontWeight:700, background:"#E0F2FE", padding:"2px 6px", borderRadius:"4px" },
  amount: { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:800, color:"#0C1A2E", whiteSpace:"nowrap" as const },
  btnG:   { padding:".4rem .9rem", borderRadius:"8px", background:"#D1FAE5", color:"#065F46", fontSize:".75rem", fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap" as const },
  btnR:   { padding:".4rem .9rem", borderRadius:"8px", background:"#FEE2E2", color:"#991B1B", fontSize:".75rem", fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap" as const },
  empty:  { textAlign:"center" as const, padding:"3rem", color:"#5B7EA6", fontSize:".85rem" },
  // Bank account settings
  settBox:{ background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:"16px", padding:"1.25rem", marginBottom:"1.5rem" },
  settT:  { fontFamily:"'Syne',sans-serif", fontSize:".88rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1rem" },
  grid:   { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:".75rem", marginBottom:"1rem" },
  fg:     { display:"flex", flexDirection:"column" as const, gap:".3rem" },
  lbl:    { fontSize:".62rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6" },
  inp:    { padding:".5rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" as const },
  btnS:   { padding:".55rem 1.25rem", borderRadius:"10px", background:"#0C1A2E", color:"#38BDF8", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer" },
};

const DEG:Record<string,string> = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc",PHD:"PhD"};

export default function AdminBankTransfers() {
  const [tab,      setTab]      = useState<"pending"|"confirmed">("pending");
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState<string|null>(null);
  const [account,  setAccount]  = useState<any>(null);
  const [saving,   setSaving]   = useState(false);
  const [acct,     setAcct]     = useState({ accountName:"", accountNumber:"", bankName:"" });

  async function loadOrders() {
    setLoading(true);
    const res  = await fetch(`/api/admin/orders?status=${tab==="pending"?"PENDING_PAYMENT":"IN_PROGRESS"}&paymentMethod=BANK_TRANSFER`);
    const data = await res.json();
    if (data.success) {
      const filtered = (data.data.orders || []).filter((o:any) => (o as any).paymentMethod === "BANK_TRANSFER");
      setOrders(filtered);
    }
    setLoading(false);
  }

  async function loadAccount() {
    const res  = await fetch("/api/orders/bank-transfer");
    const data = await res.json();
    if (data.success && data.data) {
      setAccount(data.data);
      setAcct({ accountName: data.data.accountName, accountNumber: data.data.accountNumber, bankName: data.data.bankName });
    }
  }

  useEffect(() => { loadOrders(); loadAccount(); }, [tab]);

  async function confirm(orderId: string) {
    setActing(orderId);
    const res  = await fetch("/api/orders/bank-transfer", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Payment confirmed! Chapters assigned."); loadOrders(); }
    else toast.error(data.error || "Something went wrong");
    setActing(null);
  }

  async function saveAccount() {
    if (!acct.accountName || !acct.accountNumber || !acct.bankName) {
      toast.error("All fields are required."); return;
    }
    setSaving(true);
    const res  = await fetch("/api/admin/bank-account", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(acct),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Bank account updated!"); loadAccount(); }
    else toast.error(data.error || "Failed to save");
    setSaving(false);
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Bank Transfer Orders</h1>
        <p style={C.sub}>Confirm bank transfer payments and manage your account details.</p>

        {/* Bank account settings */}
        <div style={C.settBox}>
          <div style={C.settT}>🏦 Your Bank Account Details</div>
          <div style={C.grid}>
            <div style={C.fg}>
              <label style={C.lbl}>Account Name</label>
              <input style={C.inp} value={acct.accountName} onChange={e=>setAcct(p=>({...p,accountName:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Account Number</label>
              <input style={C.inp} value={acct.accountNumber} onChange={e=>setAcct(p=>({...p,accountNumber:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Bank Name</label>
              <input style={C.inp} value={acct.bankName} onChange={e=>setAcct(p=>({...p,bankName:e.target.value}))} />
            </div>
          </div>
          <button style={C.btnS} disabled={saving} onClick={saveAccount}>
            {saving ? "Saving..." : "💾 Save Account Details"}
          </button>
        </div>

        {/* Tabs */}
        <div style={C.tabs}>
          <button style={{...C.tab,...(tab==="pending"?C.tabA:{})}} onClick={()=>setTab("pending")}>
            ⏳ Pending Confirmation
          </button>
          <button style={{...C.tab,...(tab==="confirmed"?C.tabA:{})}} onClick={()=>setTab("confirmed")}>
            ✅ Confirmed
          </button>
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : orders.length===0 ? <div style={C.empty}>No {tab} bank transfer orders.</div>
        : (
          <div style={C.card}>
            {orders.map((o:any) => (
              <div key={o.id} style={C.row}>
                <div style={{minWidth:0}}>
                  <div style={C.title}>{o.topic}</div>
                  <div style={C.meta}>{o.client?.name} · {o.client?.phone}</div>
                  <div style={C.meta}>{DEG[o.degreeGroup]||o.degreeGroup} · {o.plan?.planName}</div>
                  {(o as any).bankTransferReference && (
                    <div style={{marginTop:"4px"}}>
                      <span style={C.ref}>{(o as any).bankTransferReference}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div style={C.amount}>₦{((o.amountPaidKobo||0)/100).toLocaleString()}</div>
                  <div style={C.meta}>{o.paidAt ? new Date(o.paidAt).toLocaleDateString("en-NG") : "Not paid yet"}</div>
                </div>
                {tab === "pending" ? (
                  <button style={C.btnG} disabled={acting===o.id} onClick={()=>confirm(o.id)}>
                    {acting===o.id ? "Confirming..." : "✓ Confirm Payment"}
                  </button>
                ) : (
                  <span style={{fontSize:".75rem",color:"#065F46",fontWeight:700}}>✅ Confirmed</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
