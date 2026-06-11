"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";

const QC_NAV = [
  { label:"Dashboard",             icon:"📊", href:"/qc/dashboard"           },
  { label:"Pending Checks",        icon:"🔍", href:"/qc/checks/pending"       },
  { label:"Active Checks",         icon:"⚙️", href:"/qc/checks/active"        },
  { label:"Cleared & Sent",        icon:"✅", href:"/qc/checks/cleared"       },
  { label:"Pending Corrections",   icon:"🔧", href:"/qc/corrections/pending"  },
  { label:"Working on Corrections",icon:"✏️", href:"/qc/corrections/active"   },
  { label:"Corrections Sent",      icon:"📨", href:"/qc/corrections/done"     },
  { label:"Earnings",              icon:"💰", href:"/qc/earnings"             },
  { label:"Withdraw",              icon:"🏦", href:"/qc/withdraw"             },
  { label:"Notifications",         icon:"🔔", href:"/qc/notifications"        },
  { label:"Profile",               icon:"👤", href:"/qc/profile"              },
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
  tags:  { display:"flex", gap:".4rem", flexWrap:"wrap" as const, marginBottom:"1rem" },
  tag:   { padding:"2px 8px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, background:"#FEF9C3", color:"#854D0E" },
  files: { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem" },
  filest:{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".5rem" },
  flink: { display:"block", fontSize:".78rem", fontWeight:600, color:"#0369A1", textDecoration:"none", marginBottom:".3rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  ta:    { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"70px", boxSizing:"border-box" as const },
  inp:   { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  upzone:{ border:"2px dashed #BAE6FD", borderRadius:"12px", padding:"1.5rem", textAlign:"center" as const, cursor:"pointer", background:"#F0F9FF", marginBottom:".9rem" },
  upzoneOk:{ border:"2px dashed #4ADE80", borderRadius:"12px", padding:"1.5rem", textAlign:"center" as const, cursor:"pointer", background:"rgba(74,222,128,.04)", marginBottom:".9rem" },
  upi:   { fontSize:"1.5rem", marginBottom:".4rem" },
  uplbl: { fontSize:".82rem", fontWeight:600, color:"#0C1A2E" },
  upok:  { fontSize:".82rem", fontWeight:600, color:"#16A34A" },
  upsub: { fontSize:".72rem", color:"#5B7EA6", marginTop:".2rem" },
  btnP:  { padding:".65rem 1.25rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", width:"100%", marginBottom:".75rem" },
  btnPd: { opacity:.4, cursor:"not-allowed" as const },
  escBox:{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:"12px", padding:"1rem", marginTop:".5rem" },
  esct:  { fontSize:".82rem", fontWeight:700, color:"#9A3412", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" },
  escsub:{ fontSize:".72rem", color:"#CA8A04", marginTop:".3rem", marginBottom:".75rem" },
  escTa: { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1px solid #FED7AA", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"70px", boxSizing:"border-box" as const, background:"#fff", marginBottom:".75rem" },
  escBtn:{ padding:".6rem 1.25rem", borderRadius:"10px", background:"#FEF9C3", color:"#854D0E", fontSize:".82rem", fontWeight:700, border:"1px solid #FDE68A", cursor:"pointer" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
};

const DEG:Record<string,string> = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc"};

export default function QCChecksActive() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [state,   setState]   = useState<Record<string,any>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/qc/jobs?flow=checks&status=active&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if (data.success) {
      setJobs(data.data);
      const init:any = {};
      data.data.forEach((j:any) => { init[j.id] = { fileUrl:"", notes:"", uploading:false, submitting:false, score:"", escalateOpen:false, escNotes:"", escalating:false }; });
      setState(init);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function upd(id:string, field:string, val:any) {
    setState((prev:any) => ({...prev,[id]:{...prev[id],[field]:val}}));
  }

  async function handleUpload(jobId:string, file:File) {
    if (file.size > 20*1024*1024) { alert("Max 20MB"); return; }
    upd(jobId,"uploading",true);
    const fd = new FormData(); fd.append("file",file); fd.append("folder","chapters/qc-cleared");
    const res  = await fetch("/api/upload",{method:"POST",body:fd});
    const data = await res.json();
    if (res.ok) { upd(jobId,"fileUrl",data.url); upd(jobId,"fileName",data.fileName); }
    else alert(data.error||"Upload failed");
    upd(jobId,"uploading",false);
  }

  async function handleClear(jobId:string) {
    const s = state[jobId];
    if (!s?.fileUrl) { alert("Please upload the cleared file first."); return; }
    upd(jobId,"submitting",true);
    const res  = await fetch("/api/chapters/qc-clear",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      chapterId:jobId, clearedFileUrl:s.fileUrl, qcNotes:s.notes||undefined, plagiarismScore:s.score||undefined,
    })});
    const data = await res.json();
    if (res.ok) { alert("Chapter cleared and delivered to student!"); setJobs(prev=>prev.filter(j=>j.id!==jobId)); }
    else alert(data.error);
    upd(jobId,"submitting",false);
  }

  async function handleEscalate(jobId:string) {
    const s = state[jobId];
    if (!s.escNotes.trim()) { alert("Please provide instructions for the writer."); return; }
    upd(jobId,"escalating",true);
    const res  = await fetch("/api/chapters/qc-escalate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      chapterId:jobId, escalationType:"corrections", instructionsForWriter:s.escNotes,
    })});
    const data = await res.json();
    if (res.ok) { alert(data.message); setJobs(prev=>prev.filter(j=>j.id!==jobId)); }
    else alert(data.error);
    upd(jobId,"escalating",false);
  }

  function getGuideUrls(url:string|null) {
    if (!url) return [];
    return url.split(",").map(u=>u.trim()).filter(Boolean);
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = QC_NAV.map(item => item.href==="/qc/checks/active" ? {...item,badge:jobs.length} : item);

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Active Checks</h1>
        <p style={C.sub}>Run your checks, upload the cleared file and send to student.</p>

        <div style={{position:"relative",marginBottom:"1.25rem"}}>
          <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
          <input style={{width:"100%",padding:".65rem 1rem .65rem 2.2rem",borderRadius:"10px",border:"1.5px solid #BAE6FD",fontSize:".85rem",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box" as const}}
            placeholder="Search by topic..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>⚙️</div>
            <div style={C.etitle}>No active checks.</div>
          </div>
        ) : jobs.map((job:any) => {
          const s = state[job.id]||{};
          const guideUrls = getGuideUrls(job.guidelineFileUrl);
          return (
            <div key={job.id} style={C.card}>
              <div style={C.head}>
                <div>
                  <div style={C.title}>{job.chapterLabel}</div>
                  <div style={C.meta}>{job.topic}</div>
                  <div style={C.meta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup} · {job.planName}</div>
                </div>
                <span style={C.badge}>Active</span>
              </div>

              <div style={C.tags}>
                {job.requiresPlagiarism && <span style={C.tag}>🔍 Plagiarism Check</span>}
                {job.requiresAI && <span style={{...C.tag,background:"#EDE9FE",color:"#5B21B6"}}>🤖 AI Check</span>}
              </div>

              <div style={C.files}>
                <div style={C.filest}>Files</div>
                {job.submittedFileUrl && (
                  <a href={job.submittedFileUrl} target="_blank" rel="noreferrer" style={C.flink}>⬇ Download Submitted Chapter</a>
                )}
                {guideUrls.map((url:string,i:number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" style={C.flink}>
                    📎 Guideline {guideUrls.length>1?`File ${i+1}`:"File"}
                  </a>
                ))}
              </div>

              {job.specialInstructions && (
                <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:"10px",padding:".75rem 1rem",marginBottom:"1rem",fontSize:".78rem",color:"#0369A1"}}>
                  <div style={{fontSize:".65rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".08em",marginBottom:".3rem"}}>Student Instructions</div>
                  {job.specialInstructions}
                </div>
              )}

              <div style={C.fg}>
                <label style={C.lbl}>Plagiarism Score % <span style={{fontWeight:400,textTransform:"none" as const,letterSpacing:0,color:"#5B7EA6"}}>(optional)</span></label>
                <input style={C.inp} type="number" min="0" max="100" placeholder="e.g. 12" value={s.score||""} onChange={e=>upd(job.id,"score",e.target.value)} />
              </div>

              <div style={C.fg}>
                <label style={C.lbl}>QC Notes <span style={{fontWeight:400,textTransform:"none" as const,letterSpacing:0,color:"#5B7EA6"}}>(optional)</span></label>
                <textarea style={C.ta} rows={3} placeholder="Any notes about this check..." value={s.notes||""} onChange={e=>upd(job.id,"notes",e.target.value)} />
              </div>

              <div style={s.fileUrl?C.upzoneOk:C.upzone}
                onClick={()=>{ const inp=document.createElement("input");inp.type="file";inp.accept=".pdf,.doc,.docx";inp.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleUpload(job.id,f);};inp.click(); }}>
                {s.uploading ? <div><div style={C.upi}>⏳</div><div style={C.uplbl}>Uploading...</div></div>
                : s.fileUrl  ? <div><div style={C.upi}>✅</div><div style={C.upok}>{s.fileName||"File uploaded"}</div><div style={C.upsub}>Tap to replace</div></div>
                : <div><div style={C.upi}>📄</div><div style={C.uplbl}>Upload Cleared Chapter</div><div style={C.upsub}>PDF or Word · Max 20MB</div></div>}
              </div>

              <button style={{...C.btnP,...(!s.fileUrl?C.btnPd:{})}} disabled={!s.fileUrl||s.submitting} onClick={()=>handleClear(job.id)}>
                {s.submitting?"Sending...":"✅ Clear & Send to Student →"}
              </button>

              <div style={C.escBox}>
                <div style={C.esct} onClick={()=>upd(job.id,"escalateOpen",!s.escalateOpen)}>
                  <span>🔧 Send Back to Writer</span>
                  <span>{s.escalateOpen?"▲":"▼"}</span>
                </div>
                <div style={C.escsub}>Use if the chapter needs content corrections before it can be cleared.</div>
                {s.escalateOpen && (
                  <>
                    <textarea style={C.escTa} rows={3} placeholder="Be specific about what the writer needs to fix..." value={s.escNotes||""} onChange={e=>upd(job.id,"escNotes",e.target.value)} />
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
