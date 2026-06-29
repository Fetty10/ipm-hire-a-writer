"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";

const NAV = [
  { label:"Dashboard",    icon:"📊", href:"/writer/dashboard" },
  { label:"Pending Jobs", icon:"📋", href:"/writer/jobs/pending" },
  { label:"Active Jobs",  icon:"✍️", href:"/writer/jobs/active" },
  { label:"Corrections",  icon:"🔧", href:"/writer/corrections" },
  { label:"Delivered",    icon:"✅", href:"/writer/jobs/delivered" },
  { label:"Earnings",     icon:"💰", href:"/writer/earnings" },
  { label:"Withdraw",     icon:"🏦", href:"/writer/withdraw" },
  { label:"Notifications",icon:"🔔", href:"/writer/notifications" },
  { label:"Profile",      icon:"👤", href:"/writer/profile" },
];

const DEG: Record<string,string> = { OND_HND_NCE:"HND/OND/NCE", BSC_BED_BA:"BSc/BEd/BA", PGD_MSC_PHD:"PGD/MSc", PHD:"PhD" };

const C = {
  page:   { maxWidth:"680px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:    { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:   { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem", marginBottom:"1rem" },
  cardActive: { background:"#fff", borderRadius:"16px", border:"1.5px solid #FCA5A5", padding:"1.25rem", marginBottom:"1rem" },
  head:   { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:".75rem" },
  ctitle: { fontFamily:"'Syne',sans-serif", fontSize:".92rem", fontWeight:700, color:"#0C1A2E" },
  cmeta:  { fontSize:".75rem", color:"#5B7EA6", marginTop:".2rem" },
  badge:  { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700 },
  bActive:{ background:"#FEE2E2", color:"#991B1B" },
  bDone:  { background:"#D1FAE5", color:"#065F46" },
  noteBox:{ borderRadius:"10px", padding:".85rem", marginTop:".75rem", fontSize:".82rem", lineHeight:1.6 },
  qcNote: { background:"#FFF7ED", border:"1px solid #FED7AA", color:"#7C2D12" },
  studentNote: { background:"#F0F9FF", border:"1px solid #BAE6FD", color:"#0C4A6E" },
  noteLbl:{ fontWeight:700, fontSize:".72rem", textTransform:"uppercase" as const, letterSpacing:".06em", marginBottom:".3rem" },
  empty:  { textAlign:"center" as const, padding:"3rem 1rem", color:"#5B7EA6" },
  pg:     { display:"flex", gap:".5rem", justifyContent:"center", marginTop:"1.5rem", flexWrap:"wrap" as const },
  pgBtn:  { padding:".4rem .9rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".8rem", fontWeight:700, cursor:"pointer", background:"#fff", color:"#0C1A2E" },
  pgA:    { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  pgD:    { opacity:.4, cursor:"not-allowed" as const },
  goBtn:  { padding:".5rem 1rem", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontSize:".78rem", fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap" as const },
};

export default function WriterCorrections() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/staff/jobs?status=corrections&page=${page}`);
    const data = await res.json();
    if (data.success) {
      setJobs(data.data);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"WR";

  return (
    <StaffLayout navItems={NAV} role="Writer" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Corrections</h1>
        <p style={C.sub}>QC-flagged corrections — newest first. Active corrections need your attention; resolved ones are kept for your records.</p>
        {total > 0 && <p style={{fontSize:".72rem",color:"#5B7EA6",marginBottom:"1.25rem"}}>{total} correction{total!==1?"s":""} total</p>}

        {loading ? (
          <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div style={C.empty}>
            <div style={{fontSize:"2.5rem",marginBottom:"1rem"}}>✅</div>
            <p style={{fontWeight:600}}>No corrections — great work!</p>
          </div>
        ) : (
          <>
            {jobs.map((job:any) => {
              const isActive = job.isEscalatedCorrection;
              return (
                <div key={job.id} style={isActive ? C.cardActive : C.card}>
                  <div style={C.head}>
                    <div>
                      <div style={C.ctitle}>{job.chapterLabel} — {job.topic}</div>
                      <div style={C.cmeta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup}</div>
                    </div>
                    <span style={{...C.badge, ...(isActive ? C.bActive : C.bDone)}}>
                      {isActive ? "🔧 In Progress" : "✓ Resolved"}
                    </span>
                  </div>

                  {isActive && job.qcEscalationNotes && (
                    <div style={{...C.noteBox, ...C.qcNote}}>
                      <div style={C.noteLbl}>🔧 QC's Instructions</div>
                      {job.qcEscalationNotes}
                    </div>
                  )}
                  {isActive && job.correctionNotes && (
                    <div style={{...C.noteBox, ...C.studentNote}}>
                      <div style={C.noteLbl}>📋 Student's Original Request</div>
                      {job.correctionNotes}
                    </div>
                  )}

                  {isActive && job.supervisorNotesUrl && (
                    <div style={{margin:".5rem 0"}}>
                      {job.supervisorNotesUrl.split(",").map((u:string,i:number,arr:string[]) => (
                        <a key={i}
                          href={`/api/download/guideline?url=${encodeURIComponent(u.trim())}&label=${encodeURIComponent(`Supervisor Notes${arr.length>1?` ${i+1}`:""} ${job.topic}`)}`}
                          target="_blank" rel="noreferrer"
                          style={{display:"inline-flex",alignItems:"center",gap:".4rem",fontSize:".78rem",fontWeight:700,color:"#0369A1",textDecoration:"none",marginRight:"1rem"}}>
                          📎 Supervisor's Notes{arr.length>1?` ${i+1}`:""}
                        </a>
                      ))}
                    </div>
                  )}

                  <div style={{display:"flex",gap:".75rem",alignItems:"center",marginTop:"1rem",flexWrap:"wrap" as const}}>
                    <a href={`/api/download?chapterId=${job.id}`} target="_blank" rel="noreferrer" style={{fontSize:".78rem",fontWeight:700,color:"#0369A1",textDecoration:"none"}}>
                      ⬇ Download {isActive ? "Original File" : "Final File"}
                    </a>
                    {isActive && (
                      <a href="/writer/jobs/active" style={C.goBtn}>Go to Active Jobs to Resolve →</a>
                    )}
                  </div>
                </div>
              );
            })}

            {pages > 1 && (
              <div style={C.pg}>
                <button style={{...C.pgBtn,...(page===1?C.pgD:{})}} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
                {Array.from({length:pages},(_,i)=>i+1).map(p=>(
                  <button key={p} style={{...C.pgBtn,...(p===page?C.pgA:{})}} onClick={()=>setPage(p)}>{p}</button>
                ))}
                <button style={{...C.pgBtn,...(page===pages?C.pgD:{})}} disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </StaffLayout>
  );
}
