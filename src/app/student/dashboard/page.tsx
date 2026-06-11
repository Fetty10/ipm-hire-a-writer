"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/student/StudentLayout";

const C = {
  page:    { maxWidth:"680px", margin:"0 auto" },
  h1:      { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:     { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  grid:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem", marginBottom:"1.5rem" },
  card:    { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", cursor:"pointer", transition:"all .2s" },
  cardFeat:{ background:"#fff", borderRadius:"16px", border:"2px solid #38BDF8", boxShadow:"0 2px 12px rgba(14,165,233,.1)", padding:"1.25rem", cursor:"pointer", transition:"all .2s" },
  icon:    { fontSize:"1.5rem", marginBottom:".5rem" },
  val:     { fontFamily:"'Syne',sans-serif", fontSize:".92rem", fontWeight:700, color:"#0C1A2E" },
  valSub:  { fontSize:".75rem", color:"#5B7EA6", marginTop:".15rem" },
  empty:   { textAlign:"center" as const, padding:"3rem 1rem" },
  eIcon:   { fontSize:"2.5rem", marginBottom:".75rem" },
  eTitle:  { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E", marginBottom:".4rem" },
  eSub:    { fontSize:".83rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  btn:     { display:"inline-flex", alignItems:"center", gap:".4rem", padding:".7rem 1.4rem", borderRadius:"12px", background:"#38BDF8", color:"#0C1A2E", fontWeight:700, fontSize:".85rem", cursor:"pointer", border:"none", fontFamily:"'DM Sans',sans-serif" },
  orderCard:{ background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem", marginBottom:"1rem" },
  oHead:   { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  oTitle:  { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  oMeta:   { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badge:   { display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, flexShrink:0 as const },
  bYellow: { background:"#FEF9C3", color:"#854D0E" },
  bSky:    { background:"#E0F2FE", color:"#0369A1" },
  bGreen:  { background:"#D1FAE5", color:"#065F46" },
  tracker: { display:"flex", alignItems:"center", marginBottom:"1rem", position:"relative" as const },
  tLine:   { position:"absolute" as const, left:0, right:0, top:"16px", height:"2px", background:"#E0F2FE", zIndex:0 },
  tStep:   { flex:1, display:"flex", flexDirection:"column" as const, alignItems:"center", position:"relative" as const, zIndex:1 },
  tDot:    { width:"32px", height:"32px", borderRadius:"50%", border:"2px solid #E0F2FE", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem", color:"#5B7EA6" },
  tDotD:   { width:"32px", height:"32px", borderRadius:"50%", border:"2px solid #38BDF8", background:"#38BDF8", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem", color:"#fff", fontWeight:700 },
  tDotA:   { width:"32px", height:"32px", borderRadius:"50%", border:"2px solid #38BDF8", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem", color:"#0C1A2E", boxShadow:"0 0 0 3px rgba(56,189,248,.2)" },
  tLabel:  { fontSize:".6rem", fontWeight:600, marginTop:".3rem", color:"#5B7EA6", textAlign:"center" as const },
  tLabelD: { fontSize:".6rem", fontWeight:600, marginTop:".3rem", color:"#0369A1", textAlign:"center" as const },
  tLabelA: { fontSize:".6rem", fontWeight:700, marginTop:".3rem", color:"#0C1A2E", textAlign:"center" as const },
  chRow:   { display:"flex", alignItems:"center", gap:".75rem", padding:".6rem .75rem", borderRadius:"10px", border:"1px solid #E0F2FE", marginBottom:".4rem", background:"rgba(240,249,255,.4)" },
  chNum:   { width:"28px", height:"28px", borderRadius:"8px", background:"#E0F2FE", color:"#0369A1", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".75rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  chNumD:  { width:"28px", height:"28px", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".75rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  chLabel: { flex:1, fontSize:".8rem", fontWeight:600, color:"#0C1A2E" },
  dlBtn:   { fontSize:".75rem", fontWeight:600, color:"#0369A1", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" },
  moreBtn: { fontSize:".78rem", color:"#0369A1", fontWeight:600, background:"none", border:"none", cursor:"pointer", display:"block", margin:".5rem auto 0", textDecoration:"underline" },
};

const STEPS = ["Paid","Assigned","Writing","QC","Done"];
const STATUS_STEPS: Record<string,number> = {PENDING_PAYMENT:0,PAYMENT_CONFIRMED:1,IN_PROGRESS:2,QC_REVIEW:3,DELIVERED:4};

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [downloads, setDownloads] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [oRes, dRes] = await Promise.all([
        fetch("/api/student/orders"),
        fetch("/api/student/downloads"),
      ]);
      const oData = await oRes.json();
      const dData = await dRes.json();
      if (oData.success) setOrders(oData.data);
      if (dData.success) setDownloads(dData.data.length);
      setLoading(false);
    }
    load();
  }, []);

  const active    = orders.filter(o=>["IN_PROGRESS","QC_REVIEW","PAYMENT_CONFIRMED"].includes(o.status));
  const completed = orders.filter(o=>o.status==="DELIVERED");
  const latest    = active[0];
  const name      = session?.user?.name?.split(" ")[0] || "there";

  return (
    <StudentLayout badges={{"/student/inprogress":active.length,"/student/downloads":downloads}}>
      <div style={C.page}>
        <h1 style={C.h1}>Hello, {name} 👋</h1>
        <p style={C.sub}>What would you like to do today?</p>

        {/* Quick action grid */}
        <div style={C.grid}>
          {[
            { icon:"✍️", label:"Hire a Writer",    sub:"Place a new order",          href:"/student/hire",       feat:true  },
            { icon:"⏳", label:"Works in Progress", sub:`${active.length} active`,    href:"/student/inprogress", feat:false },
            { icon:"✅", label:"Completed Works",   sub:`${completed.length} done`,   href:"/student/completed",  feat:false },
            { icon:"⬇️", label:"Downloads",         sub:`${downloads} files ready`,   href:"/student/downloads",  feat:false },
          ].map(item=>(
            <div key={item.href}
              style={item.feat ? C.cardFeat : C.card}
              onClick={()=>router.push(item.href)}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor="#38BDF8"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor=item.feat?"#38BDF8":"#E0F2FE"}>
              <div style={C.icon}>{item.icon}</div>
              <div style={C.val}>{item.label}</div>
              <div style={C.valSub}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Latest order */}
        {latest && (
          <div style={C.orderCard}>
            <div style={C.oHead}>
              <div>
                <p style={{fontSize:".68rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".08em",color:"#5B7EA6",marginBottom:".25rem"}}>Latest Order</p>
                <div style={C.oTitle}>{latest.topic}</div>
                <div style={C.oMeta}>{latest.planName} Plan · {latest.deliveredChapters}/{latest.totalChapters} chapters delivered</div>
              </div>
              <span style={{...C.badge,...(latest.status==="QC_REVIEW"?C.bSky:C.bYellow)}}>
                {latest.status==="IN_PROGRESS"?"In Progress":latest.status==="QC_REVIEW"?"QC Review":"In Progress"}
              </span>
            </div>

            {/* Tracker */}
            <div style={C.tracker}>
              <div style={C.tLine}/>
              {STEPS.map((label,i)=>{
                const curr=STATUS_STEPS[latest.status]||0;
                const done=i<curr, act=i===curr;
                return (
                  <div key={label} style={C.tStep}>
                    <div style={done?C.tDotD:act?C.tDotA:C.tDot}>{done?"✓":i+1}</div>
                    <span style={done?C.tLabelD:act?C.tLabelA:C.tLabel}>{label}</span>
                  </div>
                );
              })}
            </div>

            {/* Chapters */}
            {latest.chapters?.slice(0,3).map((ch:any)=>(
              <div key={ch.id} style={C.chRow}>
                <div style={ch.status==="DELIVERED"?C.chNumD:C.chNum}>{ch.chapterNumber}</div>
                <span style={C.chLabel}>{ch.chapterLabel}</span>
                {ch.status==="DELIVERED"&&ch.deliveredFileUrl
                  ? <button style={C.dlBtn} onClick={()=>window.open(ch.deliveredFileUrl,"_blank")}>⬇ Download</button>
                  : <span style={{fontSize:".72rem",color:ch.status==="IN_PROGRESS"?"#CA8A04":ch.status==="QC_IN_PROGRESS"?"#0369A1":"#5B7EA6"}}>
                      {ch.status==="IN_PROGRESS"?"Writing...":ch.status==="QC_IN_PROGRESS"?"QC Review":"Queued"}
                    </span>}
              </div>
            ))}
            {latest.totalChapters>3&&(
              <button style={C.moreBtn} onClick={()=>router.push("/student/inprogress")}>
                View all {latest.totalChapters} chapters →
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && orders.length===0 && (
          <div style={C.empty}>
            <div style={C.eIcon}>✍️</div>
            <div style={C.eTitle}>No orders yet</div>
            <div style={C.eSub}>Get started by hiring a writer for your project.</div>
            <button style={C.btn} onClick={()=>router.push("/student/hire")}>✍️ Hire a Writer →</button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
