"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";

const NAV = [
  { label:"Dashboard",      icon:"📊", href:"/qc/dashboard" },
  { label:"Pending Checks", icon:"📋", href:"/qc/checks/pending" },
  { label:"Active Checks",  icon:"🔍", href:"/qc/checks/active" },
  { label:"Cleared",        icon:"✅", href:"/qc/checks/cleared" },
  { label:"Corrections",    icon:"🔧", href:"/qc/corrections/pending" },
  { label:"Earnings",       icon:"💰", href:"/qc/earnings" },
  { label:"Withdraw",       icon:"🏦", href:"/qc/withdraw" },
  { label:"Notifications",  icon:"🔔", href:"/qc/notifications" },
  { label:"Profile",        icon:"👤", href:"/qc/profile" },
];

const C = {
  page:   { maxWidth:"640px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:    { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:   { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  chead:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:".75rem" },
  ctitle: { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  cmeta:  { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badges: { display:"flex", gap:".4rem", flexWrap:"wrap" as const, marginBottom:"1rem" },
  badge:  { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, background:"#EDE9FE", color:"#5B21B6", flexShrink:0 as const },
  info:   { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem" },
  infot:  { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".3rem" },
  infov:  { fontSize:".82rem", color:"#0C1A2E", lineHeight:1.5 },
  chk:    { display:"flex", gap:"1rem", marginBottom:"1rem", flexWrap:"wrap" as const },
  chkItem:{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", color:"#0C1A2E", fontWeight:600 },
  chkBox: { width:"18px", height:"18px", borderRadius:"4px", border:"2px solid #BAE6FD", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  chkBoxC:{ width:"18px", height:"18px", borderRadius:"4px", background:"#38BDF8", border:"2px solid #38BDF8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  fg:     { marginBottom:".9rem" },
  lbl:    { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  ta:     { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"70px", boxSizing:"border-box" as const },
  btnP:   { padding:".65rem 1.25rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", width:"100%" },
  btnPd:  { opacity:.4, cursor:"not-allowed" as const },
  dlBtn:  { display:"inline-flex", alignItems:"center", gap:".3rem", fontSize:".78rem", fontWeight:600, color:"#0369A1", textDecoration:"none", marginBottom:"1rem" },
  empty:  { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon:  { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle: { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  esub:   { fontSize:".83rem", color:"#5B7EA6", marginTop:".3rem" },
};

const DEG:Record<string,string>  = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc"};
const PLAN:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Pro"};

export default function QCChecksActive() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [state,   setState]   = useState<Record<string,any>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/qc/jobs?flow=checks&status=active");
    const data = await res.json();
    if (data.success) {
      setJobs(data.data);
      const init:any = {};
      data.data.forEach((j:any) => {
        init[j.id] = {
          plagOk:    false,
          aiOk:      false,
          plagScore: "",
          aiScore:   "",
          fileUrl:   "",
          fileName:  "",
          notes:     "",
          uploading: false,
          submitting:false,
        };
      });
      setState(init);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function upd(id:string, field:string, val:any) {
    setState((prev:any) => ({...prev,[id]:{...prev[id],[field]:val}}));
  }

  async function handleUpload(jobId:string, file:File) {
    if (file.size > 20*1024*1024) { toast.error("Max 20MB"); return; }
    upd(jobId,"uploading",true);
    const fd = new FormData(); fd.append("file",file); fd.append("folder","chapters/qc-cleared");
    const res  = await fetch("/api/upload",{method:"POST",body:fd});
    const data = await res.json();
    if (res.ok) { upd(jobId,"fileUrl",data.url); upd(jobId,"fileName",data.fileName); }
    else toast.error(data.error||"Upload failed" || "Something went wrong");
    upd(jobId,"uploading",false);
  }

  async function handleClear(job:any) {
    const s = state[job.id];
    if (!s?.fileUrl) { toast.error("Please upload the cleared chapter file first."); return; }
    upd(job.id,"submitting",true);
    const res = await fetch("/api/chapters/qc-clear",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        chapterId:        job.id,
        clearedFileUrl:   s.fileUrl,
        qcNotes:          s.notes||undefined,
        plagiarismCleared:s.plagOk,
        aiCleared:        s.aiOk,
        plagiarismScore:  s.plagScore ? parseInt(s.plagScore) : undefined,
        aiScore:          s.aiScore   ? parseInt(s.aiScore)   : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Chapter cleared and delivered to student!"); setJobs(prev=>prev.filter(j=>j.id!==job.id)); }
    else toast.error(data.error || "Something went wrong");
    upd(job.id,"submitting",false);
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = NAV.map(item=>item.href==="/qc/checks/active"?{...item,badge:jobs.length}:item);

  return (
    <StaffLayout navItems={nav} role="QC" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Active Checks</h1>
        <p style={C.sub}>You have 24 hours to clear each chapter after starting a check.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>🔍</div>
            <div style={C.etitle}>No active checks.</div>
            <div style={C.esub}>Claim a chapter from Pending Checks to start.</div>
          </div>
        ) : jobs.map((job:any) => {
          const s = state[job.id]||{};
          const checksRequired = (job.requiresPlagiarism ? s.plagOk : true) && (job.requiresAI ? s.aiOk : true);
          const canSubmit = s.fileUrl && checksRequired;
          return (
            <div key={job.id} style={C.card}>
              <div style={C.chead}>
                <div>
                  <div style={C.ctitle}>{job.chapterLabel}</div>
                  <div style={C.cmeta}>{job.topic}</div>
                  <div style={C.cmeta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup} · {PLAN[job.planName]||job.planName}</div>
                </div>
              </div>

              <div style={C.badges}>
                <span style={C.badge}>QC Active</span>
              </div>

              {job.specialInstructions && (
                <div style={C.info}>
                  <div style={C.infot}>Student Instructions</div>
                  <div style={C.infov}>{job.specialInstructions}</div>
                </div>
              )}

              {job.submittedFileUrl && (
                <a href={job.submittedFileUrl} target="_blank" rel="noreferrer" style={C.dlBtn}>
                  📄 Download Chapter to Review
                </a>
              )}

              {/* QC Checklist */}
              {(job.requiresPlagiarism || job.requiresAI) && (
                <div style={C.chk}>
                  {job.requiresPlagiarism && (
                    <div style={C.chkItem} onClick={()=>upd(job.id,"plagOk",!s.plagOk)}>
                      <div style={s.plagOk?C.chkBoxC:C.chkBox}>{s.plagOk&&<span style={{color:"#fff",fontSize:".7rem"}}>✓</span>}</div>
                      Plagiarism check passed
                    </div>
                  )}
                  {job.requiresAI && (
                    <div style={C.chkItem} onClick={()=>upd(job.id,"aiOk",!s.aiOk)}>
                      <div style={s.aiOk?C.chkBoxC:C.chkBox}>{s.aiOk&&<span style={{color:"#fff",fontSize:".7rem"}}>✓</span>}</div>
                      AI detection check passed
                    </div>
                  )}
                </div>
              )}

              {/* Plagiarism & AI scores */}
              {(job.requiresPlagiarism || job.requiresAI) && (
                <div style={{display:"flex",gap:"1rem",marginBottom:"1rem",flexWrap:"wrap" as const}}>
                  {job.requiresPlagiarism && (
                    <div style={{display:"flex",flexDirection:"column" as const,gap:".3rem",flex:1,minWidth:"120px"}}>
                      <label style={{fontSize:".65rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".08em",color:"#5B7EA6"}}>Plagiarism % Score</label>
                      <input type="number" min="0" max="100"
                        style={{padding:".5rem .75rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",fontSize:".85rem",fontFamily:"'DM Sans',sans-serif",outline:"none"}}
                        placeholder="e.g. 12"
                        value={s.plagScore||""}
                        onChange={e=>upd(job.id,"plagScore",e.target.value)} />
                      <span style={{fontSize:".65rem",color:"#5B7EA6"}}>Enter 0-100</span>
                    </div>
                  )}
                  {job.requiresAI && (
                    <div style={{display:"flex",flexDirection:"column" as const,gap:".3rem",flex:1,minWidth:"120px"}}>
                      <label style={{fontSize:".65rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".08em",color:"#5B7EA6"}}>AI Detection % Score</label>
                      <input type="number" min="0" max="100"
                        style={{padding:".5rem .75rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",fontSize:".85rem",fontFamily:"'DM Sans',sans-serif",outline:"none"}}
                        placeholder="e.g. 5"
                        value={s.aiScore||""}
                        onChange={e=>upd(job.id,"aiScore",e.target.value)} />
                      <span style={{fontSize:".65rem",color:"#5B7EA6"}}>Enter 0-100</span>
                    </div>
                  )}
                </div>
              )}

              {/* Upload cleared file */}
              <div style={{border:"2px dashed "+(s.fileUrl?"#4ADE80":"#BAE6FD"),borderRadius:"12px",padding:"1.25rem",textAlign:"center" as const,cursor:"pointer",background:s.fileUrl?"rgba(74,222,128,.04)":"#F0F9FF",marginBottom:".9rem"}}
                onClick={()=>{const inp=document.createElement("input");inp.type="file";inp.accept=".pdf,.doc,.docx";inp.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleUpload(job.id,f);};inp.click();}}>
                {s.uploading
                  ? <div><div style={{fontSize:"1.5rem",marginBottom:".4rem"}}>⏳</div><div style={{fontSize:".82rem",fontWeight:600,color:"#0C1A2E"}}>Uploading...</div></div>
                  : s.fileUrl
                  ? <div><div style={{fontSize:"1.5rem",marginBottom:".4rem"}}>✅</div><div style={{fontSize:".82rem",fontWeight:600,color:"#16A34A"}}>{s.fileName||"File uploaded"}</div><div style={{fontSize:".72rem",color:"#5B7EA6",marginTop:".2rem"}}>Tap to replace</div></div>
                  : <div><div style={{fontSize:"1.5rem",marginBottom:".4rem"}}>📄</div><div style={{fontSize:".82rem",fontWeight:600,color:"#0C1A2E"}}>Upload Cleared Chapter</div><div style={{fontSize:".72rem",color:"#5B7EA6",marginTop:".2rem"}}>PDF or Word · Max 20MB</div></div>}
              </div>

              <div style={C.fg}>
                <label style={C.lbl}>QC Notes (optional)</label>
                <textarea style={C.ta} rows={2} placeholder="Any notes on this chapter..." value={s.notes||""} onChange={e=>upd(job.id,"notes",e.target.value)} />
              </div>

              <button style={{...C.btnP,...(!canSubmit?C.btnPd:{})}} disabled={!canSubmit||s.submitting} onClick={()=>handleClear(job)}>
                {s.submitting?"Clearing...":`✅ Clear & Deliver ${job.chapterLabel} →`}
              </button>
            </div>
          );
        })}
      </div>
    </StaffLayout>
  );
}
