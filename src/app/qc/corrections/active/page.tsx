"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { QC_NAV } from "../../_nav";

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
      data.data.forEach((j:any) => { init[j.id] = { files:[], notes:"", uploading:false, submitting:false, escalateOpen:false, escType:"corrections", escNotes:"", escalating:false }; });
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
    const s = state[jobId];
    if (s?.files?.length >= 10) { toast.error("Max 10 files per correction."); return; }
    upd(jobId,"uploading",true);
    try {
      const fd=new FormData(); fd.append("file",file); fd.append("folder","chapters/corrections");
      const res  = await fetch("/api/upload",{method:"POST",body:fd});
      const data = await res.json();
      if (res.ok) {
        upd(jobId,"files",[...(s?.files||[]), { url: data.url, name: data.fileName||file.name }]);
      } else toast.error(data.error||"Upload failed. Please try again.");
    } catch { toast.error("Upload failed — please check your connection."); }
    finally { upd(jobId,"uploading",false); }
  }

  function removeFile(jobId:string, idx:number) {
    const s = state[jobId];
    upd(jobId,"files", s.files.filter((_:any, i:number) => i !== idx));
  }

  async function handleSend(jobId:string) {
    const s = state[jobId];
    if (!s?.files?.length) { toast.error("Please upload at least one corrected file first."); return; }
    upd(jobId,"submitting",true);
    const clearedFileUrl = s.files.map((f:any) => f.url).join(",");
    const res  = await fetch("/api/chapters/qc-clear",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chapterId:jobId,clearedFileUrl,qcNotes:s.notes||undefined,isCorrection:true})});
    const data = await res.json();
    if (res.ok) { toast.success("Correction sent to student!"); setJobs(prev=>prev.filter(j=>j.id!==jobId)); }
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
                {job.guidelineFileUrl && job.guidelineFileUrl.split(",").map((u:string,i:number,arr:string[]) => (
                  <a key={i} href={`/api/download/guideline?url=${encodeURIComponent(u.trim())}&label=file`} target="_blank" rel="noreferrer" style={C.flink}>
                    ⬇ Client File{arr.length>1?` ${i+1}`:""}
                  </a>
                ))}
                {!job.submittedFileUrl && !job.guidelineFileUrl && <p style={{fontSize:".78rem",color:"#5B7EA6",fontStyle:"italic"}}>No original files available.</p>}
                {supUrl && supUrl.split(",").map((u:string,i:number,arr:string[]) => (<a key={i} href={`/api/download/guideline?url=${encodeURIComponent(u.trim())}&label=${encodeURIComponent(`Supervisor Notes${arr.length>1?` ${i+1}`:""} ${job.topic}`)}`} target="_blank" rel="noreferrer" style={C.flink}>⬇ Supervisor's Notes{arr.length>1?` ${i+1}`:""}</a>))}
              </div>

              {/* Notes */}
              <div style={C.fg}>
                <label style={C.lbl}>Your Correction Notes <span style={{fontWeight:400,textTransform:"none" as const,letterSpacing:0,color:"#5B7EA6"}}>(visible to admin & student)</span></label>
                <textarea style={C.ta} rows={3} placeholder="Describe what you corrected..." value={s.notes||""} onChange={e=>upd(job.id,"notes",e.target.value)} />
              </div>

              {/* Upload corrected files — supports multiple */}
              <div style={{marginBottom:"1rem"}}>
                <div style={C.lbl}>Upload Corrected File(s) <span style={{fontWeight:400,color:"#5B7EA6"}}>(up to 10)</span></div>

                {/* Uploaded files list */}
                {s.files?.length > 0 && (
                  <div style={{display:"flex",flexDirection:"column" as const,gap:".35rem",marginBottom:".6rem"}}>
                    {s.files.map((f:any,i:number) => (
                      <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:"8px",padding:".4rem .75rem",fontSize:".78rem"}}>
                        <span style={{color:"#065F46",fontWeight:600}}>✅ {f.name}</span>
                        <button onClick={()=>removeFile(job.id,i)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:".85rem",padding:"0 .25rem"}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add file button */}
                {(!s.files?.length || s.files.length < 10) && (
                  <div
                    style={s.uploading ? {...C.upzone,opacity:.6} : C.upzone}
                    onClick={()=>{
                      if(s.uploading) return;
                      const inp=document.createElement("input");
                      inp.type="file"; inp.accept=".pdf,.doc,.docx";
                      inp.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleUpload(job.id,f);};
                      inp.click();
                    }}>
                    {s.uploading
                      ? <div><div style={C.upi}>⏳</div><div style={C.uplbl}>Uploading...</div></div>
                      : <div><div style={C.upi}>📎</div><div style={C.uplbl}>{s.files?.length ? "＋ Add Another File" : "Tap to Upload Corrected File"}</div></div>
                    }
                  </div>
                )}
              </div>
              {/* Send to student */}
              <button style={{...C.btnP,...(!s.files?.length?C.btnPd:{})}} disabled={!s.files?.length||s.submitting} onClick={()=>handleSend(job.id)}>
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
