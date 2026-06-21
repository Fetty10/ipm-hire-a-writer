"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
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
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  head:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  title: { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  meta:  { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, background:"#FEF9C3", color:"#854D0E", flexShrink:0 as const },
  warn:  { background:"#FEF9C3", border:"1px solid #FDE68A", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem" },
  warnt: { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#854D0E", marginBottom:".5rem" },
  files: { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem" },
  filest:{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".5rem" },
  flink: { display:"block", fontSize:".78rem", fontWeight:600, color:"#0369A1", textDecoration:"none", marginBottom:".3rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  ta:    { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"70px", boxSizing:"border-box" as const },
  upzone:{ border:"2px dashed #BAE6FD", borderRadius:"12px", padding:"1.25rem", textAlign:"center" as const, cursor:"pointer", background:"#F0F9FF", marginBottom:"1rem" },
  upzoneOk:{ border:"2px dashed #4ADE80", borderRadius:"12px", padding:"1.25rem", textAlign:"center" as const, cursor:"pointer", background:"rgba(74,222,128,.04)", marginBottom:"1rem" },
  upi:   { fontSize:"1.3rem", marginBottom:".3rem" },
  uplbl: { fontSize:".8rem", fontWeight:600, color:"#0C1A2E" },
  upok:  { fontSize:".8rem", fontWeight:600, color:"#16A34A" },
  upsub: { fontSize:".7rem", color:"#5B7EA6", marginTop:".15rem" },
  btnP:  { padding:".65rem 1.25rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", width:"100%", marginBottom:"1rem" },
  btnPd: { opacity:.4, cursor:"not-allowed" as const },
  escBox:{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:"12px", padding:"1rem" },
  esct:  { fontSize:".82rem", fontWeight:700, color:"#9A3412", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" },
  escsub:{ fontSize:".72rem", color:"#CA8A04", marginTop:".3rem", marginBottom:".75rem" },
  escSel:{ width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1px solid #FED7AA", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff", marginBottom:".75rem", boxSizing:"border-box" as const },
  escTa: { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1px solid #FED7AA", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"70px", boxSizing:"border-box" as const, background:"#fff", marginBottom:".75rem" },
  escBtn:{ padding:".6rem 1.25rem", borderRadius:"10px", background:"#FEF9C3", color:"#854D0E", fontSize:".82rem", fontWeight:700, border:"1px solid #FDE68A", cursor:"pointer" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
};

const DEG:Record<string,string> = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc"};

export default function QCCorrectionsActive() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [state,   setState]   = useState<Record<string,any>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/qc/jobs?flow=corrections&status=active");
    const data = await res.json();
    if (data.success) {
      setJobs(data.data);
      const init:any = {};
      data.data.forEach((j:any) => { init[j.id] = { fileUrl:"", notes:"", uploading:false, submitting:false, escalateOpen:false, escType:"corrections", escNotes:"", escalating:false }; });
      setState(init);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function upd(id:string, field:string, val:any) {
    setState((prev:any) => ({...prev,[id]:{...prev[id],[field]:val}}));
  }

  async function handleUpload(jobId:string, file:File) {
    if (file.size>20*1024*1024) { toast.error("Max 20MB"); return; }
    upd(jobId,"uploading",true);
    const fd=new FormData(); fd.append("file",file); fd.append("folder","chapters/corrections");
    const res  = await fetch("/api/upload",{method:"POST",body:fd});
    const data = await res.json();
    if (res.ok) { upd(jobId,"fileUrl",data.url); upd(jobId,"fileName",data.fileName); }
    else toast.error(data.error||"Upload failed" || "Something went wrong");
    upd(jobId,"uploading",false);
  }

  async function handleSend(jobId:string) {
    const s = state[jobId];
    if (!s?.fileUrl) { toast.error("Please upload the corrected file first."); return; }
    upd(jobId,"submitting",true);
    const res  = await fetch("/api/chapters/qc-clear",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chapterId:jobId,clearedFileUrl:s.fileUrl,qcNotes:s.notes||undefined,isCorrection:true})});
    const data = await res.json();
    if (res.ok) { toast.error("Correction sent to student!"); setJobs(prev=>prev.filter(j=>j.id!==jobId)); }
    else toast.error(data.error || "Something went wrong");
    upd(jobId,"submitting",false);
  }

  async function handleEscalate(jobId:string) {
    const s = state[jobId];
    if (!s.escNotes.trim()) { toast.error("Please provide instructions for the writer."); return; }
    upd(jobId,"escalating",true);
    const res  = await fetch("/api/chapters/qc-escalate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chapterId:jobId,escalationType:s.escType,instructionsForWriter:s.escNotes})});
    const data = await res.json();
    if (res.ok) { toast.success(data.message); setJobs(prev=>prev.filter(j=>j.id!==jobId)); }
    else toast.error(data.error || "Something went wrong");
    upd(jobId,"escalating",false);
  }

  function getSupervisorUrl(adminNotes:string|null) {
    if (!adminNotes) return null;
    const m = adminNotes.match(/supervisor_notes:(.+)/);
    return m ? m[1] : null;
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = QC_NAV.map(item=>item.href==="/qc/corrections/active"?{...item,badge:jobs.length}:item);

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Working on Corrections</h1>
        <p style={C.sub}>Make corrections and send back to student, or escalate to writer if needed.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>✏️</div>
            <div style={C.etitle}>No corrections in progress.</div>
          </div>
        ) : jobs.map((job:any) => {
          const s = state[job.id]||{};
          const supUrl = getSupervisorUrl(job.adminNotes);
          return (
            <div key={job.id} style={C.card}>
              <div style={C.head}>
                <div>
                  <div style={C.title}>{job.chapterLabel} {job.isUrgent && <span style={{marginLeft:".4rem",fontSize:".62rem",fontWeight:800,color:"#991B1B",background:"#FEE2E2",padding:"1px 7px",borderRadius:"999px"}}>🚨 URGENT</span>}</div>
                  <div style={C.meta}>{job.topic}</div>
                  <div style={C.meta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup}</div>
                </div>
                <span style={C.badge}>In Progress</span>
              </div>

              {job.correctionNotes && (
                <div style={C.warn}>
                  <div style={C.warnt}>Student's Request (for reference)</div>
                  <p style={{fontSize:".82rem",color:"#854D0E",lineHeight:1.5}}>{job.correctionNotes}</p>
                </div>
              )}

              <div style={C.files}>
                <div style={C.filest}>Files to Work From</div>
                {job.submittedFileUrl && <a href={`/api/download?chapterId=${job.id}`} target="_blank" rel="noreferrer" style={C.flink}>⬇ {job.chapterLabel} — Original Delivered Version</a>}
                {supUrl && supUrl.split(",").map((u:string,i:number,arr:string[]) => (<a key={i} href={`/api/download/guideline?url=${encodeURIComponent(u.trim())}&label=${encodeURIComponent(`Supervisor Notes${arr.length>1?` ${i+1}`:""}`)}`} target="_blank" rel="noreferrer" style={C.flink}>⬇ Supervisor's Notes{arr.length>1?` ${i+1}`:""}</a>))}
              </div>

              {/* Notes */}
              <div style={C.fg}>
                <label style={C.lbl}>Your Correction Notes <span style={{fontWeight:400,textTransform:"none" as const,letterSpacing:0,color:"#5B7EA6"}}>(visible to admin & student)</span></label>
                <textarea style={C.ta} rows={3} placeholder="Describe what you corrected..." value={s.notes||""} onChange={e=>upd(job.id,"notes",e.target.value)} />
              </div>

              {/* Upload corrected file */}
              <div
                style={s.fileUrl ? C.upzoneOk : C.upzone}
                onClick={()=>{ const inp=document.createElement("input");inp.type="file";inp.accept=".pdf,.doc,.docx";inp.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleUpload(job.id,f);};inp.click(); }}>
                {s.uploading ? <div><div style={C.upi}>⏳</div><div style={C.uplbl}>Uploading...</div></div>
                : s.fileUrl  ? <div><div style={C.upi}>✅</div><div style={C.upok}>{s.fileName||"File uploaded"}</div><div style={C.upsub}>Tap to replace</div></div>
                : <div><div style={C.upi}>📄</div><div style={C.uplbl}>Upload Corrected {job.chapterLabel}</div><div style={C.upsub}>PDF or Word · Max 20MB</div></div>}
              </div>

              {/* Send to student */}
              <button style={{...C.btnP,...(!s.fileUrl?C.btnPd:{})}} disabled={!s.fileUrl||s.submitting} onClick={()=>handleSend(job.id)}>
                {s.submitting?"Sending...":"✅ Send Correction to Student →"}
              </button>

              {/* Escalate */}
              <div style={C.escBox}>
                <div style={C.esct} onClick={()=>upd(job.id,"escalateOpen",!s.escalateOpen)}>
                  <span>🔧 Escalate to Writer</span>
                  <span>{s.escalateOpen?"▲":"▼"}</span>
                </div>
                <div style={C.escsub}>Use only if the correction requires the writer to rewrite content.</div>
                {s.escalateOpen && (
                  <>
                    <select style={C.escSel} value={s.escType} onChange={e=>upd(job.id,"escType",e.target.value)}>
                      <option value="corrections">Send back for specific corrections</option>
                      <option value="section_rewrite">Request section rewrite</option>
                      <option value="full_rewrite">Request full chapter rewrite</option>
                    </select>
                    <textarea style={C.escTa} rows={3} placeholder="Be specific about what the writer needs to fix..." value={s.escNotes} onChange={e=>upd(job.id,"escNotes",e.target.value)} />
                    <button style={C.escBtn} disabled={s.escalating} onClick={()=>handleEscalate(job.id)}>
                      {s.escalating?"Sending...":"🔧 Send Back to Writer →"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </StaffLayout>
  );
}
