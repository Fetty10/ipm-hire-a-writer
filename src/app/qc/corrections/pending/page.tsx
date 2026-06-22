"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { QC_NAV } from "../../_nav";

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:".75rem" },
  notice:{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1.25rem", fontSize:".78rem", color:"#0369A1" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  head:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  title: { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  meta:  { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, background:"#FFEDD5", color:"#9A3412", flexShrink:0 as const },
  warn:  { background:"#FEF9C3", border:"1px solid #FDE68A", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem" },
  warnt: { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#854D0E", marginBottom:".5rem" },
  files: { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem" },
  filest:{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".5rem" },
  flink: { display:"block", fontSize:".78rem", fontWeight:600, color:"#0369A1", textDecoration:"none", marginBottom:".3rem" },
  btnP:  { padding:".65rem 1.25rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
};

const DEG:Record<string,string> = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc"};

export default function QCCorrectionsPending() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting,setStarting]= useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/qc/jobs?flow=corrections&status=pending");
    const data = await res.json();
    if (data.success) setJobs(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStart(id: string) {
    setStarting(id);
    const res  = await fetch("/api/qc/start", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({chapterId:id}) });
    const data = await res.json();
    if (res.ok) { setJobs(prev=>prev.filter(j=>j.id!==id)); router.push("/qc/corrections/active"); }
    else toast.error(data.error || "Something went wrong");
    setStarting(null);
  }

  function getSupervisorUrl(adminNotes: string|null) {
    if (!adminNotes) return null;
    const m = adminNotes.match(/supervisor_notes:(.+)/);
    return m ? m[1] : null;
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = QC_NAV.map(item=>item.href==="/qc/corrections/pending"?{...item,badge:jobs.length}:item);

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Pending Corrections</h1>
        <p style={C.sub}>Student correction requests assigned to you.</p>
        <div style={C.notice}>ℹ Your job is to make the corrections and send back. Only escalate to the writer if the issue requires content-level changes.</div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>✅</div>
            <div style={C.etitle}>No pending correction requests.</div>
          </div>
        ) : jobs.map((job:any) => {
          const supUrl = getSupervisorUrl(job.adminNotes);
          return (
            <div key={job.id} style={C.card}>
              <div style={C.head}>
                <div>
                  <div style={C.title}>{job.chapterLabel} {job.isUrgent && <span style={{marginLeft:".4rem",fontSize:".62rem",fontWeight:800,color:"#991B1B",background:"#FEE2E2",padding:"1px 7px",borderRadius:"999px"}}>🚨 URGENT</span>}</div>
                  <div style={C.meta}>{job.topic}</div>
                  <div style={C.meta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup}</div>
                </div>
                <span style={C.badge}>Correction Needed</span>
              </div>

              {job.correctionNotes && (
                <div style={C.warn}>
                  <div style={C.warnt}>Student's Correction Request</div>
                  <p style={{fontSize:".82rem",color:"#854D0E",lineHeight:1.5}}>{job.correctionNotes}</p>
                </div>
              )}

              <div style={C.files}>
                <div style={C.filest}>Files to Work From</div>
                {job.submittedFileUrl && <a href={`/api/download?chapterId=${job.id}`} target="_blank" rel="noreferrer" style={C.flink}>⬇ Download {job.chapterLabel} (Delivered Version)</a>}
                {supUrl && supUrl.split(",").map((u:string,i:number,arr:string[]) => (<a key={i} href={`/api/download/guideline?url=${encodeURIComponent(u.trim())}&label=${encodeURIComponent(`Supervisor Notes${arr.length>1?` ${i+1}`:""}`)}`} target="_blank" rel="noreferrer" style={C.flink}>⬇ Supervisor's Notes{arr.length>1?` ${i+1}`:""}</a>))}
                {!job.submittedFileUrl && !supUrl && <p style={{fontSize:".78rem",color:"#5B7EA6",fontStyle:"italic"}}>No files uploaded yet.</p>}
              </div>

              <button style={C.btnP} disabled={starting===job.id} onClick={()=>handleStart(job.id)}>
                {starting===job.id?"Starting...":"✏️ Work on this Correction →"}
              </button>
            </div>
          );
        })}
      </div>
    </StaffLayout>
  );
}
