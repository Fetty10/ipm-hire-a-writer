"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { QC_NAV } from "../../_nav";

const DEG: Record<string,string> = { OND_HND_NCE:"HND/OND/NCE", BSC_BED_BA:"BSc/BEd/BA", PGD_MSC_PHD:"PGD/MSc", PHD:"PhD" };

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  sbar:  { position:"relative" as const, marginBottom:"1.25rem" },
  sinput:{ width:"100%", padding:".65rem 1rem .65rem 2.2rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  chead: { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  ctitle:{ fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  cmeta: { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, flexShrink:0 as const },
  bGray: { background:"#F1F5F9", color:"#64748B" },
  bPurple:{ background:"#EDE9FE", color:"#5B21B6" },
  info:  { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".78rem", color:"#0369A1" },
  infot: { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".3rem" },
  link:  { display:"inline-flex", alignItems:"center", gap:".3rem", fontSize:".78rem", fontWeight:600, color:"#0369A1", textDecoration:"none", marginBottom:"1rem" },
  btns:  { display:"flex", gap:".5rem", flexWrap:"wrap" as const },
  btnP:  { padding:".55rem 1.1rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".8rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E", marginBottom:".3rem" },
  esub:  { fontSize:".83rem", color:"#5B7EA6" },
};

export default function QCChecksPending() {
  const { data: session } = useSession();
  const router  = useRouter();
  const [jobs,     setJobs]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [starting, setStarting] = useState<string|null>(null);

  const load = useCallback(async()=>{
    setLoading(true);
    const res  = await fetch(`/api/qc/jobs?flow=checks&status=pending&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if(data.success) setJobs(data.data);
    setLoading(false);
  },[search]);

  useEffect(()=>{ load(); },[load]);

  async function handleStart(id:string) {
    setStarting(id);
    const res  = await fetch("/api/qc/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chapterId:id})});
    const data = await res.json();
    if(res.ok){ setJobs(prev=>prev.filter(j=>j.id!==id)); router.push("/qc/checks/active"); }
    else toast.error(data.error || "Something went wrong");
    setStarting(null);
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = QC_NAV.map(item=>item.href==="/qc/checks/pending"?{...item,badge:jobs.length}:item);

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Pending Checks</h1>
        <p style={C.sub}>Plagiarism/AI checks assigned to you, not yet started.</p>

        <div style={C.sbar}>
          <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
          <input style={C.sinput} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by topic..." />
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>📭</div>
            <div style={C.etitle}>No pending checks</div>
            <p style={C.esub}>You're all caught up. New checks will appear here when assigned.</p>
          </div>
        ) : (
          jobs.map((job:any) => (
            <div key={job.id} style={C.card}>
              <div style={C.chead}>
                <div>
                  <div style={C.ctitle}>
                    {job.chapterLabel} {job.isUrgent && <span style={{marginLeft:".4rem",fontSize:".62rem",fontWeight:800,color:"#991B1B",background:"#FEE2E2",padding:"1px 7px",borderRadius:"999px"}}>🚨 URGENT</span>}
                  </div>
                  <div style={C.cmeta}>{job.topic}</div>
                  <div style={C.cmeta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup}</div>
                </div>
                <span style={{...C.badge,...C.bGray}}>Pending</span>
              </div>

              {(job.requiresPlagiarism || job.requiresAI) && (
                <div style={{display:"flex",gap:".4rem",marginBottom:"1rem",flexWrap:"wrap" as const}}>
                  {job.requiresPlagiarism && <span style={{...C.badge,...C.bPurple}}>Plagiarism Check</span>}
                  {job.requiresAI && <span style={{...C.badge,...C.bPurple}}>AI Detection</span>}
                </div>
              )}

              {job.specialInstructions && (
                <div style={C.info}>
                  <div style={C.infot}>Student Instructions</div>
                  {job.specialInstructions}
                </div>
              )}

              {job.guidelineFileUrl && job.guidelineFileUrl.split(",").map((url:string,i:number,arr:string[]) => (
                <a key={i} href={`/api/download/guideline?url=${encodeURIComponent(url.trim())}&label=${encodeURIComponent(`Guideline${arr.length>1?` ${i+1}`:""} ${job.topic}`)}`}
                  target="_blank" rel="noreferrer" style={C.link}>
                  📎 {arr.length>1?`Guideline ${i+1}`:"Download Guideline"}
                </a>
              ))}

              <div style={C.btns}>
                <button style={C.btnP} disabled={starting===job.id} onClick={()=>handleStart(job.id)}>
                  {starting===job.id?"Starting...":"▶ Start Check →"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </StaffLayout>
  );
}
