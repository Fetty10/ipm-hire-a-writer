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

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  chead: { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:".75rem" },
  ctitle:{ fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  cmeta: { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badges:{ display:"flex", gap:".4rem", flexWrap:"wrap" as const, marginBottom:"1rem" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, background:"#FEF9C3", color:"#854D0E", flexShrink:0 as const },
  info:  { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".78rem", color:"#0369A1" },
  infot: { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", marginBottom:".3rem" },
  warn:  { background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".78rem", color:"#9A3412" },
  warnt: { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", marginBottom:".75rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  ta:    { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"70px", boxSizing:"border-box" as const },
  fg:    { marginBottom:".9rem" },
  upzone:{ border:"2px dashed #BAE6FD", borderRadius:"12px", padding:"1.5rem", textAlign:"center" as const, cursor:"pointer", background:"#F0F9FF", marginBottom:".9rem" },
  upzoneOk:{ border:"2px dashed #4ADE80", borderRadius:"12px", padding:"1.5rem", textAlign:"center" as const, cursor:"pointer", background:"rgba(74,222,128,.04)", marginBottom:".9rem" },
  upi:   { fontSize:"1.5rem", marginBottom:".4rem" },
  uplbl: { fontSize:".82rem", fontWeight:600, color:"#0C1A2E" },
  upok:  { fontSize:".82rem", fontWeight:600, color:"#16A34A" },
  upsub: { fontSize:".72rem", color:"#5B7EA6", marginTop:".2rem" },
  btnP:  { padding:".65rem 1.25rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", width:"100%" },
  btnPd: { opacity:.4, cursor:"not-allowed" as const },
  lock:  { fontSize:".75rem", color:"#CA8A04", fontWeight:600, marginBottom:".75rem" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  esub:  { fontSize:".83rem", color:"#5B7EA6", marginTop:".3rem" },
};

const DEG:Record<string,string>  = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc"};

export default function WriterActiveJobs() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [state,   setState]   = useState<Record<string,any>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/staff/jobs?status=active&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if (data.success) {
      setJobs(data.data);
      const init:any = {};
      data.data.forEach((j:any) => { init[j.id] = { files:[], notes:"", obj:j.researchObjectives||"", hyp:j.hypotheses||"", scope:j.scopeOfStudy||"", submitting:false, uploading:false }; });
      setState(init);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function upd(id:string, field:string, val:any) {
    setState((prev:any) => ({...prev,[id]:{...prev[id],[field]:val}}));
  }

  async function handleSubmit(job:any) {
    const s = state[job.id];
    if (!s?.files?.length) { toast.error("Please upload at least one file first."); return; }
    upd(job.id,"submitting",true);
    const fileUrl = s.files.map((f:any) => f.url).join(",");
    const res = await fetch("/api/chapters/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      chapterId:job.id, fileUrl, writerNotes:s.notes||undefined,
      researchObjectives:s.obj||undefined,
      hypotheses:s.hyp||undefined, scopeOfStudy:s.scope||undefined,
    })});
    const data = await res.json();
    if (res.ok) { toast.success(data.routedToQC ? "Submitted — QC will review before delivery." : "Submitted — Delivered to student!"); setJobs(prev=>prev.filter(j=>j.id!==job.id)); }
    else toast.error(data.error || "Something went wrong");
    upd(job.id,"submitting",false);
  }

  async function handleUpload(jobId:string, file:File) {
    if (file.size>20*1024*1024) { toast.error("Max 20MB"); return; }
    const s = state[jobId];
    if (s?.files?.length >= 10) { toast.error("Max 10 files."); return; }
    upd(jobId,"uploading",true);
    try {
      const fd=new FormData(); fd.append("file",file); fd.append("folder","chapters/submitted");
      const res  = await fetch("/api/upload",{method:"POST",body:fd});
      const data = await res.json();
      if (res.ok) {
        upd(jobId,"files",[...(s?.files||[]), { url: data.url, name: data.fileName||file.name }]);
      } else toast.error(data.error||"Upload failed. Please try again.");
    } catch {
      toast.error("Upload failed — please check your connection and try again.");
    } finally {
      upd(jobId,"uploading",false);
    }
  }

  function removeFile(jobId:string, idx:number) {
    const s = state[jobId];
    upd(jobId,"files", (s?.files||[]).filter((_:any, i:number) => i !== idx));
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"WR";
  const nav = NAV.map(item=>item.href==="/writer/jobs/active"?{...item,badge:jobs.length}:item);

  return (
    <StaffLayout navItems={nav} role="Writer" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Active Jobs</h1>
        <p style={C.sub}>Upload your completed work and submit. Deadline: 3 working days.</p>

        <div style={{position:"relative",marginBottom:"1.25rem"}}>
          <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
          <input style={{width:"100%",padding:".65rem 1rem .65rem 2.2rem",borderRadius:"10px",border:"1.5px solid #BAE6FD",fontSize:".85rem",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box" as const}}
            placeholder="Search by topic..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>✍️</div>
            <div style={C.etitle}>No active jobs.</div>
            <div style={C.esub}>Start a job from Pending Jobs to see it here.</div>
          </div>
        ) : jobs.map((job:any) => {
          const s = state[job.id]||{};
          const prelimOk = !job.requiresPrelim || !!job.prelimSubmittedAt || (s.obj&&s.hyp&&s.scope);
          return (
            <div key={job.id} style={C.card}>
              <div style={C.chead}>
                <div>
                  <div style={C.ctitle}>{job.chapterLabel} {job.isUrgent && <span style={{marginLeft:".4rem",fontSize:".62rem",fontWeight:800,color:"#991B1B",background:"#FEE2E2",padding:"1px 7px",borderRadius:"999px"}}>🚨 URGENT</span>}
                  {job.isEscalatedCorrection && <span style={{marginLeft:".4rem",fontSize:".62rem",fontWeight:800,color:"#9A3412",background:"#FFEDD5",padding:"1px 7px",borderRadius:"999px"}}>🔧 QC CORRECTION</span>}</div>
                  <div style={C.cmeta}>{job.topic}</div>
                  <div style={C.cmeta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup}</div>
                  <div style={{display:"flex",gap:"1rem",marginTop:".3rem",flexWrap:"wrap" as const}}>
                    <span style={{fontSize:".7rem",color:"#5B7EA6"}}>🟢 Started: <strong>{job.startedAt ? new Date(job.startedAt).toLocaleDateString("en-NG",{day:"numeric",month:"short"}) : "—"}</strong></span>
                    {job.deadlineAt && (() => {
                      const dl = new Date(job.deadlineAt);
                      const days = Math.ceil((dl.getTime()-Date.now())/(1000*60*60*24));
                      const color = days < 0 ? "#DC2626" : days <= 1 ? "#D97706" : "#065F46";
                      const bg    = days < 0 ? "#FEF2F2" : days <= 1 ? "#FFF7ED" : "#F0FDF4";
                      return <span style={{fontSize:".7rem",fontWeight:700,color,background:bg,padding:"1px 6px",borderRadius:"4px"}}>
                        {days < 0 ? `⚠️ Overdue by ${Math.abs(days)}d` : days === 0 ? "⏰ Due today" : `⏳ Due ${dl.toLocaleDateString("en-NG",{day:"numeric",month:"short"})} (${days}d left)`}
                      </span>;
                    })()}
                  </div>
                </div>
              </div>

              <div style={C.badges}>
                <span style={C.badge}>In Progress</span>
              </div>

              {job.qcEscalationNotes && (
                <div style={C.warn}>
                  <div style={C.warnt}>🔧 QC's Instructions</div>
                  {job.qcEscalationNotes}
                </div>
              )}
              {job.correctionNotes && (
                <div style={{...C.warn, background:"#F0F9FF", borderColor:"#BAE6FD"}}>
                  <div style={{...C.warnt, color:"#0369A1"}}>📋 Student's Original Request</div>
                  {job.correctionNotes}
                </div>
              )}

              {job.supervisorNotesUrl && (
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

              {job.specialInstructions && (
                <div style={C.info}><div style={C.infot}>Student Instructions</div>{job.specialInstructions}</div>
              )}

              {job.guidelineFileUrl && job.guidelineFileUrl.split(",").map((url:string, i:number) => (
                <a key={i} href={`/api/download/guideline?url=${encodeURIComponent(url.trim())}&label=${encodeURIComponent(job.guidelineFileUrl.split(",").length>1?`Guideline ${i+1} ${job.topic}`:`Guideline ${job.topic}`)}`} target="_blank" rel="noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:".3rem",fontSize:".78rem",fontWeight:600,color:"#0369A1",textDecoration:"none",marginBottom:"1rem",marginRight:"1rem"}}>
                  📎 {job.guidelineFileUrl.split(",").length>1?`Guideline ${i+1}`:"Download Guideline"}
                </a>
              ))}

              {job.requiresPrelim && (
                <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:"10px",padding:"1rem",marginBottom:"1rem"}}>
                  <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".08em",color:"#0369A1",marginBottom:"1rem"}}>Required Before Uploading Chapter 1</div>
                  {[
                    {label:"Research Objectives",field:"obj",ph:"State the research objectives..."},
                    {label:"Hypotheses",          field:"hyp",ph:"State your hypotheses..."},
                    {label:"Scope of Study",      field:"scope",ph:"Describe scope and limitations..."},
                  ].map(f=>(
                    <div key={f.field} style={C.fg}>
                      <label style={C.lbl}>{f.label}</label>
                      <textarea style={C.ta} rows={3} placeholder={f.ph} value={s[f.field]||""} onChange={e=>upd(job.id,f.field,e.target.value)} />
                    </div>
                  ))}
                </div>
              )}

              {/* Upload zone — multi-file for journal sourcing, single file for everything else */}
              {job.serviceType === "JOURNAL_SOURCING" ? (
                <div>
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
                  {(!s.files?.length || s.files.length < 10) && (
                    <div style={s.uploading ? {...C.upzone,opacity:.6} : C.upzone}
                      onClick={()=>{
                        if(s.uploading) return;
                        const inp=document.createElement("input");
                        inp.type="file"; inp.accept=".pdf,.doc,.docx";
                        inp.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleUpload(job.id,f);};
                        inp.click();
                      }}>
                      {s.uploading
                        ? <div><div style={C.upi}>⏳</div><div style={C.uplbl}>Uploading...</div></div>
                        : <div><div style={C.upi}>📄</div><div style={C.uplbl}>{s.files?.length ? "＋ Add Another Journal" : "Upload Journal Files"}</div><div style={C.upsub}>PDF or Word · Max 20MB · Up to 10 files</div></div>
                      }
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={s.files?.length ? C.upzoneOk : C.upzone}
                  onClick={()=>{
                    const inp=document.createElement("input");
                    inp.type="file"; inp.accept=".pdf,.doc,.docx";
                    inp.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleUpload(job.id,f);};
                    inp.click();
                  }}>
                  {s.uploading ? <div><div style={C.upi}>⏳</div><div style={C.uplbl}>Uploading...</div></div>
                  : s.files?.length ? <div><div style={C.upi}>✅</div><div style={C.upok}>{s.files[0].name}</div><div style={C.upsub}>Tap to replace</div></div>
                  : <div><div style={C.upi}>📄</div><div style={C.uplbl}>Upload {job.chapterLabel}</div><div style={C.upsub}>PDF or Word · Max 20MB</div></div>}
                </div>
              )}

              {job.requiresPrelim && !prelimOk && <p style={C.lock}>🔒 Complete all preliminary fields above to unlock upload</p>}

              <div style={C.fg}>
                <label style={C.lbl}>Notes for Admin (optional)</label>
                <textarea style={C.ta} rows={2} placeholder="Any notes about this chapter..." value={s.notes||""} onChange={e=>upd(job.id,"notes",e.target.value)} />
              </div>

              <button style={{...C.btnP,...((!s.files?.length||!prelimOk||s.submitting)?C.btnPd:{})}} disabled={!s.files?.length||!prelimOk||s.submitting} onClick={()=>handleSubmit(job)}>
                {s.submitting?"Submitting...":`Submit ${job.chapterLabel} →`}
              </button>
            </div>
          );
        })}
      </div>
    </StaffLayout>
  );
}
