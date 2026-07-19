"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { QC_NAV } from "../../_nav";

const DEG:Record<string,string> = { OND_HND_NCE:"HND/OND/NCE", BSC_BED_BA:"BSc/BEd/BA", PGD_MSC_PHD:"PGD/MSc/PhD", PHD:"PhD" };

const C = {
  pg:    { display:"flex", gap:".4rem", justifyContent:"center", marginTop:"1rem" },
  pgBtn: { padding:".4rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", background:"#fff", fontSize:".78rem", fontWeight:600, cursor:"pointer", color:"#0C1A2E" },
  pgA:   { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  pgD:   { opacity:.4, cursor:"not-allowed" as const },
};

export default function QCCorrectionsDone() {
  const { data: session } = useSession();
  const [records,  setRecords]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);

  const initials = (session?.user?.name||"QC").split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = (QC_NAV||[]).map((item:any) => item.href === "/qc/corrections/done" ? {...item, badge: total} : item);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/qc/corrections-history?page=${page}&search=${encodeURIComponent(search)}`)
      .then(r=>r.json())
      .then(d=>{ if(d.success){ setRecords(d.data||[]); setPages(d.pages||1); setTotal(d.total||0); } setLoading(false); });
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div style={{maxWidth:"640px",margin:"0 auto"}}>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"1.6rem",fontWeight:800,color:"#0C1A2E",letterSpacing:"-.02em",marginBottom:".25rem"}}>Corrections Sent</h1>
        <p style={{fontSize:".85rem",color:"#5B7EA6",marginBottom:"1.25rem"}}>Corrections you've completed and sent back to students.</p>

        <input style={{width:"100%",padding:".65rem 1rem",borderRadius:"12px",border:"1.5px solid #BAE6FD",fontSize:".83rem",outline:"none",marginBottom:"1rem",boxSizing:"border-box" as const}}
          placeholder="Search by topic..." value={search}
          onChange={e=>{ setSearch(e.target.value); setPage(1); }} />

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : records.length===0 ? (
          <div style={{textAlign:"center",padding:"4rem 1rem"}}>
            <div style={{fontSize:"2.5rem",marginBottom:".75rem"}}>📭</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:700,color:"#0C1A2E"}}>No corrections completed yet.</div>
          </div>
        ) : (
          <>
            <div>
              {records.map((r:any)=>(
                <div key={r.id} style={{background:"#fff",borderRadius:"14px",border:"1.5px solid #E0F2FE",padding:"1rem 1.25rem",marginBottom:".6rem"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:".85rem",fontWeight:700,color:"#0C1A2E"}}>{r.chapterLabel}</div>
                      <div style={{fontSize:".75rem",color:"#5B7EA6",marginTop:"2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{r.topic}</div>
                      <div style={{fontSize:".72rem",color:"#5B7EA6"}}>{r.department} · {DEG[r.degreeGroup]||r.degreeGroup}</div>
                      {r.resolvedAt && <div style={{fontSize:".68rem",color:"#94A3B8",marginTop:"2px"}}>Sent {new Date(r.resolvedAt).toLocaleDateString("en-NG")}</div>}
                    </div>
                    <span style={{display:"inline-flex",padding:"3px 10px",borderRadius:"999px",fontSize:".68rem",fontWeight:700,background:"#D1FAE5",color:"#065F46",flexShrink:0}}>Sent ✓</span>
                  </div>
                  {r.studentRequest && (
                    <div style={{marginTop:".75rem",padding:".6rem .85rem",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:"8px",fontSize:".75rem",color:"#92400E"}}>
                      <strong>Correction request:</strong> <span style={{whiteSpace:"pre-wrap"}}>{r.studentRequest}</span>
                    </div>
                  )}
                  {r.fileAfterUrl && (
                    <div style={{marginTop:".5rem"}}>
                      {r.fileAfterUrl.split(",").map((url:string,i:number,arr:string[])=>(
                        <a key={i} href={`/api/download/guideline?url=${encodeURIComponent(url.trim())}&label=file`}
                          target="_blank" rel="noreferrer"
                          style={{display:"inline-block",marginRight:".5rem",fontSize:".72rem",color:"#0369A1",fontWeight:700}}>
                          ⬇ Corrected File{arr.length>1?` ${i+1}`:""}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

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
