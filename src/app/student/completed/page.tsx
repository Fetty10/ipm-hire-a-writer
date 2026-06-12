"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/student/StudentLayout";
import NextDynamic from "next/dynamic";

const AddChaptersModal = dynamic(() => import("@/components/student/AddChaptersModal"), { ssr: false });

const DEG:Record<string,string>={OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem", marginBottom:"1rem" },
  head:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:".75rem" },
  title: { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  meta:  { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, flexShrink:0 as const },
  bGreen:{ background:"#D1FAE5", color:"#065F46" },
  bBlue: { background:"#E0F2FE", color:"#0369A1" },
  chrow: { display:"flex", alignItems:"center", gap:".75rem", padding:".5rem .75rem", borderRadius:"8px", border:"1px solid #E0F2FE", marginBottom:".3rem", background:"rgba(240,249,255,.4)" },
  chnum: { width:"26px", height:"26px", borderRadius:"6px", background:"#38BDF8", color:"#0C1A2E", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".72rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  chlbl: { flex:1, fontSize:".78rem", fontWeight:600, color:"#0C1A2E" },
  dlBtn: { fontSize:".72rem", fontWeight:600, color:"#0369A1", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" },
  btns:  { display:"flex", gap:".5rem", marginTop:"1rem", flexWrap:"wrap" as const },
  btnO:  { padding:".5rem 1rem", borderRadius:"10px", background:"#fff", color:"#0369A1", fontSize:".78rem", fontWeight:700, border:"1.5px solid #38BDF8", cursor:"pointer" },
  addBtn:{ padding:".5rem 1rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".78rem", fontWeight:700, border:"none", cursor:"pointer" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  esub:  { fontSize:".83rem", color:"#5B7EA6", marginTop:".3rem" },
};

export default function StudentCompleted() {
  const router = useRouter();
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [addModal, setAddModal] = useState<string|null>(null);

  useEffect(()=>{
    fetch("/api/student/orders?filter=completed")
      .then(r=>r.json())
      .then(d=>{ if(d.success) setOrders(d.data); })
      .finally(()=>setLoading(false));
  },[]);

  return (
    <StudentLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Completed Works</h1>
        <p style={C.sub}>Orders with at least one delivered chapter.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : orders.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>✅</div>
            <div style={C.etitle}>No completed chapters yet.</div>
            <div style={C.esub}>Delivered chapters will appear here.</div>
          </div>
        ) : orders.map((o:any)=>{
          const delivered    = o.chapters.filter((ch:any)=>ch.status==="DELIVERED");
          const isFullyDone  = o.status==="DELIVERED";
          const hasAllChapters = o.totalChapters >= 5;
          return (
            <div key={o.id} style={C.card}>
              <div style={C.head}>
                <div>
                  <div style={C.title}>{o.topic}</div>
                  <div style={C.meta}>{DEG[o.degreeGroup]||o.degreeGroup} · {o.planName}</div>
                  <div style={C.meta}>{delivered.length} of {o.totalChapters} chapter{o.totalChapters>1?"s":""} delivered</div>
                </div>
                <span style={{...C.badge,...(isFullyDone?C.bGreen:C.bBlue)}}>
                  {isFullyDone?"Complete ✓":"Partial"}
                </span>
              </div>

              {delivered.map((ch:any)=>(
                <div key={ch.id} style={C.chrow}>
                  <div style={C.chnum}>{ch.chapterNumber}</div>
                  <span style={C.chlbl}>{ch.chapterLabel}</span>
                  {ch.deliveredFileUrl
                    ? <button style={C.dlBtn} onClick={()=>window.open(ch.deliveredFileUrl,"_blank")}>⬇ Download</button>
                    : <span style={{fontSize:".7rem",color:"#5B7EA6"}}>Processing</span>}
                </div>
              ))}

              <div style={C.btns}>
                <button style={C.btnO} onClick={()=>router.push("/student/downloads")}>⬇ All Downloads</button>
                <button style={C.btnO} onClick={()=>router.push("/student/corrections")}>🔧 Request Correction</button>
                {!hasAllChapters && (
                  <button style={C.addBtn} onClick={()=>setAddModal(o.id)}>➕ Add More Chapters</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {addModal && (
        <AddChaptersModal orderId={addModal} onClose={()=>setAddModal(null)} />
      )}
    </StudentLayout>
  );
}
