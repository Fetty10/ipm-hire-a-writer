"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";
import NextDynamic from "next/dynamic";

const AddChaptersModal = NextDynamic(() => import("@/components/student/AddChaptersModal"), { ssr: false });

const STEPS=["Paid","Assigned","Writing","QC","Done"];
const STATUS_STEPS:Record<string,number>={PENDING_PAYMENT:0,PAYMENT_CONFIRMED:1,IN_PROGRESS:2,QC_REVIEW:3,DELIVERED:4};
const isBankPending = (o:any) => o.status === 'PENDING_PAYMENT' && (o as any).paymentMethod === 'BANK_TRANSFER';

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem", marginBottom:"1rem" },
  ohead: { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  otitle:{ fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  ometa: { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, flexShrink:0 as const },
  bY:    { background:"#FEF9C3", color:"#854D0E" },
  bS:    { background:"#E0F2FE", color:"#0369A1" },
  tracker:{ display:"flex", alignItems:"center", marginBottom:"1rem", position:"relative" as const },
  tline: { position:"absolute" as const, left:0, right:0, top:"16px", height:"2px", background:"#E0F2FE", zIndex:0 },
  tstep: { flex:1, display:"flex", flexDirection:"column" as const, alignItems:"center", position:"relative" as const, zIndex:1 },
  tdot:  { width:"32px", height:"32px", borderRadius:"50%", border:"2px solid #E0F2FE", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem", color:"#5B7EA6" },
  tdotD: { width:"32px", height:"32px", borderRadius:"50%", border:"2px solid #38BDF8", background:"#38BDF8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem", color:"#fff", fontWeight:700 },
  tdotA: { width:"32px", height:"32px", borderRadius:"50%", border:"2px solid #38BDF8", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem", boxShadow:"0 0 0 3px rgba(56,189,248,.2)" },
  tlbl:  { fontSize:".6rem", fontWeight:600, marginTop:".3rem", color:"#5B7EA6", textAlign:"center" as const },
  tlblD: { fontSize:".6rem", fontWeight:600, marginTop:".3rem", color:"#0369A1", textAlign:"center" as const },
  tlblA: { fontSize:".6rem", fontWeight:700, marginTop:".3rem", color:"#0C1A2E", textAlign:"center" as const },
  chrow: { display:"flex", alignItems:"center", gap:".75rem", padding:".6rem .75rem", borderRadius:"10px", border:"1px solid #E0F2FE", marginBottom:".4rem", background:"rgba(240,249,255,.4)" },
  chnum: { width:"28px", height:"28px", borderRadius:"8px", background:"#E0F2FE", color:"#0369A1", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".75rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  chnumD:{ width:"28px", height:"28px", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".75rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  chlbl: { flex:1, fontSize:".8rem", fontWeight:600, color:"#0C1A2E" },
  dlBtn: { fontSize:".75rem", fontWeight:600, color:"#0369A1", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" },
  addBtn:{ display:"inline-flex", alignItems:"center", gap:".3rem", padding:".45rem .9rem", borderRadius:"8px", border:"1.5px solid #38BDF8", background:"#F0F9FF", color:"#0369A1", fontSize:".75rem", fontWeight:700, cursor:"pointer", marginTop:".75rem" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
};

export default function StudentInProgress() {
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal,setAddModal]= useState<string|null>(null);
  const [chapterReqs, setChapterReqs] = useState<any[]>([]);

  function loadData() {
    fetch("/api/student/orders?filter=active")
      .then(r=>r.json())
      .then(d=>{ if(d.success) setOrders(d.data); })
      .finally(()=>setLoading(false));
    fetch("/api/student/chapter-requests")
      .then(r=>r.json())
      .then(d=>{ if(d.success) setChapterReqs(d.data); });
  }

  useEffect(()=>{
    loadData();
    // If returning from a payment redirect (Paystack), the webhook may still be
    // processing — refetch a couple more times over the next few seconds to
    // catch the update without requiring a manual page refresh.
    const t1 = setTimeout(loadData, 2000);
    const t2 = setTimeout(loadData, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  },[]);

  // Poll periodically while there's an unconfirmed bank transfer (order or add-chapters)
  // so the page updates automatically once admin confirms — no manual refresh needed.
  useEffect(() => {
    const hasPendingOrder   = orders.some(o => o.status === "PENDING_PAYMENT" && o.paymentMethod === "BANK_TRANSFER");
    const hasPendingChapter = chapterReqs.some(r => r.status === "PENDING_PAYMENT");
    if (!hasPendingOrder && !hasPendingChapter) return;

    const interval = setInterval(loadData, 20000); // every 20 seconds
    return () => clearInterval(interval);
  }, [orders, chapterReqs]);

  return (
    <StudentLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Works in Progress</h1>
        <p style={C.sub}>Track each chapter of your active orders.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : orders.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>⏳</div>
            <div style={C.etitle}>No active orders.</div>
          </div>
        ) : orders.map((order:any)=>{
          const curr = STATUS_STEPS[order.status]||0;
          const hasAllChapters = order.totalChapters >= 5;
          return (
            <div key={order.id} style={C.card}>
              <div style={C.ohead}>
                <div>
                  <div style={C.otitle}>{order.topic}</div>
                  <div style={C.ometa}>
                    {order.serviceType && order.serviceType !== "HIRE_WRITER"
                      ? order.serviceTypeLabel || order.serviceType.replace(/_/g," ")
                      : `${order.planName} Plan · ${order.deliveredChapters}/${order.totalChapters} chapters delivered`}
                  </div>
                </div>
                {isBankPending(order) ? (
                  <span style={{...C.badge, background:"#FEF9C3", color:"#854D0E"}}>⏳ Awaiting Payment Confirmation</span>
                ) : (
                  <span style={{...C.badge,...(order.status==="QC_REVIEW"?C.bS:C.bY)}}>
                    {order.status==="QC_REVIEW"?"QC Review":"In Progress"}
                  </span>
                )}
              </div>

              {/* Bank transfer notice */}
              {isBankPending(order) && (
                <div style={{background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:"10px",padding:".75rem 1rem",marginBottom:"1rem",fontSize:".78rem",color:"#9A3412",lineHeight:1.5}}>
                  🏦 <strong>Payment Pending:</strong> Your bank transfer order has been received. Once we confirm your payment, your chapters will be assigned and work will begin. This usually takes within 30 minutes during business hours.
                  {(order as any).bankTransferReference && (
                    <div style={{marginTop:".4rem"}}>Reference: <strong style={{fontFamily:"monospace"}}>{(order as any).bankTransferReference}</strong></div>
                  )}
                </div>
              )}

              {/* Pending/confirmed add-chapter requests for this order */}
              {chapterReqs.filter(r => r.orderId === order.id).map(r => (
                <div key={r.id} style={{
                  background: r.status === "PENDING_PAYMENT" ? "#FFF7ED" : "#F0FDF4",
                  border: `1px solid ${r.status === "PENDING_PAYMENT" ? "#FED7AA" : "#BBF7D0"}`,
                  borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem",
                  fontSize:".78rem", color: r.status === "PENDING_PAYMENT" ? "#9A3412" : "#166534", lineHeight:1.5
                }}>
                  {r.status === "PENDING_PAYMENT" ? (
                    <>📎 <strong>Additional Chapter(s) Pending:</strong> You requested Chapter(s) {r.chapterNumbers.split(",").join(", ")} via bank transfer (₦{(r.amountKobo/100).toLocaleString()}). Awaiting payment confirmation.</>
                  ) : (
                    <>✅ <strong>Additional Chapter(s) Confirmed:</strong> Chapter(s) {r.chapterNumbers.split(",").join(", ")} have been assigned and work has begun.</>
                  )}
                  <div style={{marginTop:".3rem"}}>Reference: <strong style={{fontFamily:"monospace"}}>{r.reference}</strong></div>
                </div>
              ))}

              {/* Progress tracker */}
              <div style={C.tracker}>
                <div style={C.tline}/>
                {STEPS.map((label,i)=>{
                  const done=i<curr, act=i===curr;
                  return (
                    <div key={label} style={C.tstep}>
                      <div style={done?C.tdotD:act?C.tdotA:C.tdot}>{done?"✓":i+1}</div>
                      <span style={done?C.tlblD:act?C.tlblA:C.tlbl}>{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Chapters */}
              {order.chapters?.map((ch:any)=>(
                <div key={ch.id} style={C.chrow}>
                  <div style={ch.status==="DELIVERED"?C.chnumD:C.chnum}>{ch.chapterNumber}</div>
                  <span style={C.chlbl}>{ch.chapterLabel}</span>
                  {ch.status==="DELIVERED"&&ch.deliveredFileUrl
                    ? <button style={C.dlBtn} onClick={()=>window.open(`/api/download?chapterId=${ch.id}`,"_blank")}>⬇ Download</button>
                    : <span style={{fontSize:".72rem",color:ch.status==="IN_PROGRESS"?"#CA8A04":ch.status==="QC_IN_PROGRESS"?"#0369A1":"#5B7EA6"}}>
                        {ch.status==="IN_PROGRESS"?"Writing...":ch.status==="QC_IN_PROGRESS"?"QC Review":"Queued"}
                      </span>}
                </div>
              ))}

              {/* Add more chapters button — only for project/thesis orders */}
              {!hasAllChapters && (!order.serviceType || order.serviceType === "HIRE_WRITER") && (
                <button style={C.addBtn} onClick={()=>setAddModal(order.id)}>
                  ➕ Add More Chapters
                </button>
              )}
            </div>
          );
        })}
      </div>

      {addModal && (
        <AddChaptersModal orderId={addModal} onClose={()=>{ setAddModal(null); loadData(); }} />
      )}
    </StudentLayout>
  );
}
