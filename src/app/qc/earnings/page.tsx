"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";

const QC_NAV = [
  { label:"Dashboard",           icon:"📊", href:"/qc/dashboard"              },
  { label:"Pending Checks",      icon:"🔍", href:"/qc/checks/pending"          },
  { label:"Active Checks",       icon:"⚙️", href:"/qc/checks/active"           },
  { label:"Cleared & Sent",      icon:"✅", href:"/qc/checks/cleared"          },
  { label:"Pending Corrections", icon:"🔧", href:"/qc/corrections/pending"     },
  { label:"Working on Corrections",icon:"✏️",href:"/qc/corrections/active"     },
  { label:"Corrections Sent",    icon:"📨", href:"/qc/corrections/done"        },
  { label:"Earnings",            icon:"💰", href:"/qc/earnings"                },
  { label:"Withdraw",            icon:"🏦", href:"/qc/withdraw"                },
  { label:"Notifications",       icon:"🔔", href:"/qc/notifications"           },
  { label:"Profile",             icon:"👤", href:"/qc/profile"                 },
];

const C = {
  page:  { maxWidth:"760px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:".75rem", marginBottom:"1.25rem" },
  scard: { background:"#fff", borderRadius:"14px", border:"1.5px solid #E0F2FE", padding:"1rem", textAlign:"center" as const },
  sval:  { fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, lineHeight:1 },
  slbl:  { fontSize:".72rem", color:"#5B7EA6", marginTop:".2rem" },
  cta:   { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"12px", padding:"1rem 1.25rem", marginBottom:"1.25rem", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem" },
  ctaTxt:{ fontSize:".85rem", fontWeight:700, color:"#0C1A2E" },
  ctaSub:{ fontSize:".75rem", color:"#5B7EA6", marginTop:".2rem" },
  btnP:  { padding:".55rem 1.1rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".8rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", flexShrink:0 as const },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem" },
  ctitle:{ fontFamily:"'Syne',sans-serif", fontSize:".85rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1rem" },
  table: { width:"100%", borderCollapse:"collapse" as const, fontSize:".78rem" },
  th:    { textAlign:"left" as const, padding:".5rem .75rem", fontSize:".6rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", borderBottom:"1px solid #E0F2FE" },
  td:    { padding:".6rem .75rem", borderBottom:"1px solid #F0F9FF", color:"#0C1A2E" },
  badge: { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700 },
  empty: { textAlign:"center" as const, padding:"2rem", color:"#5B7EA6", fontSize:".82rem" },
};

const PLAN:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Pro"};
const DEG:Record<string,string>  = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc"};

export default function WriterEarnings() {
  const { data: session } = useSession();
  const router = useRouter();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [summary,  setSummary]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);
  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"WR";

  useEffect(()=>{
    setLoading(true);
    fetch(`/api/staff/earnings?page=${page}`).then(r=>r.json()).then(d=>{
      if(d.success){
        setEarnings(d.data.earnings);
        setSummary(d.data.summary);
        setTotal(d.data.total||0);
        setPages(d.data.pages||1);
      }
      setLoading(false);
    });
  },[page]);

  return (
    <StaffLayout navItems={QC_NAV} role="Quality Control" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Earnings</h1>
        <p style={C.sub}>Your per-job earnings breakdown.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <>
            <div style={C.grid4}>
              {[
                {label:"Available",   val:(summary?.availableKobo||0)/100,    color:"#0284C7"},
                {label:"Pending",     val:(summary?.pendingKobo||0)/100,      color:"#CA8A04"},
                {label:"Total Earned",val:(summary?.totalKobo||0)/100,        color:"#0C1A2E"},
                {label:"Withdrawn",   val:(summary?.withdrawnKobo||0)/100,    color:"#16A34A"},
              ].map(s=>(
                <div key={s.label} style={C.scard}>
                  <div style={{...C.sval,color:s.color}}>₦{(s.val||0).toLocaleString()}</div>
                  <div style={C.slbl}>{s.label}</div>
                </div>
              ))}
            </div>

            {(summary?.availableKobo||0)>0 && (
              <div style={C.cta}>
                <div>
                  <div style={C.ctaTxt}>₦{((summary?.availableKobo||0)/100).toLocaleString()} available to withdraw</div>
                  <div style={C.ctaSub}>Admin approval required · Paystack auto-transfers once approved.</div>
                </div>
                <button style={C.btnP} onClick={()=>router.push("/qc/withdraw")}>Withdraw →</button>
              </div>
            )}

            <div style={C.card}>
              <div style={C.ctitle}>Earnings Per Job</div>
              {earnings.length===0 ? <div style={C.empty}>No earnings yet.</div> : (
                <div style={{overflowX:"auto"}}>
                  <table style={C.table}>
                    <thead>
                      <tr>{["Topic","Service","Chapter","My Earning","Status"].map(h=><th key={h} style={C.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {earnings.map((e:any)=>(
                        <tr key={e.id}>
                          <td style={{...C.td,maxWidth:"140px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.topic}</td>
                          <td style={{...C.td,whiteSpace:"nowrap" as const,color:"#5B7EA6"}}>{DEG[e.degreeGroup]||e.degreeGroup||"—"}</td>
                          <td style={{...C.td,whiteSpace:"nowrap" as const}}>{e.chapterLabel}</td>
                          <td style={{...C.td,fontWeight:700,color:"#0284C7",whiteSpace:"nowrap" as const}}>₦{((e.amountKobo||0)/100).toLocaleString()}</td>
                          <td style={C.td}>
                            <span style={{...C.badge,...(
                              e.status==="AVAILABLE"?{background:"#D1FAE5",color:"#065F46"}:
                              e.status==="PENDING"?{background:"#FEF9C3",color:"#854D0E"}:
                              {background:"#F1F5F9",color:"#64748B"}
                            )}}>
                              {e.status==="AVAILABLE"?"Available":e.status==="PENDING"?"Pending":"Withdrawn"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {total > 0 && <p style={{fontSize:".7rem",color:"#5B7EA6",marginTop:".75rem"}}>{total} earning{total!==1?"s":""} total</p>}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{display:"flex",gap:".5rem",justifyContent:"center",marginTop:"1.5rem",flexWrap:"wrap" as const}}>
                <button style={{padding:".4rem .9rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",fontSize:".8rem",fontWeight:700,cursor:page===1?"not-allowed":"pointer",opacity:page===1?.4:1,background:"#fff",color:"#0C1A2E"}}
                  disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
                {Array.from({length:pages},(_,i)=>i+1).map(p=>(
                  <button key={p} style={{padding:".4rem .9rem",borderRadius:"8px",fontSize:".8rem",fontWeight:700,cursor:"pointer",border:"1.5px solid",
                    background:p===page?"#0C1A2E":"#fff",color:p===page?"#38BDF8":"#0C1A2E",borderColor:p===page?"#0C1A2E":"#BAE6FD"}}
                    onClick={()=>setPage(p)}>{p}</button>
                ))}
                <button style={{padding:".4rem .9rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",fontSize:".8rem",fontWeight:700,cursor:page===pages?"not-allowed":"pointer",opacity:page===pages?.4:1,background:"#fff",color:"#0C1A2E"}}
                  disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </StaffLayout>
  );
}
