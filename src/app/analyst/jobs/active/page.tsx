"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";

const NAV = [
  { label:"Dashboard",    icon:"📊", href:"/analyst/dashboard" },
  { label:"Pending Jobs", icon:"📋", href:"/analyst/jobs/pending" },
  { label:"Active Jobs",  icon:"✍️", href:"/analyst/jobs/active" },
  { label:"Delivered",    icon:"✅", href:"/analyst/jobs/delivered" },
  { label:"Earnings",     icon:"💰", href:"/analyst/earnings" },
  { label:"Withdraw",     icon:"🏦", href:"/analyst/withdraw" },
  { label:"Notifications",icon:"🔔", href:"/analyst/notifications" },
  { label:"Profile",      icon:"👤", href:"/analyst/profile" },
];

const C = {
  page:     { maxWidth:"640px", margin:"0 auto" },
  h1:       { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:      { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:     { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  chead:    { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  ctitle:   { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  cmeta:    { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badge:    { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, background:"#FEF9C3", color:"#854D0E", flexShrink:0 as const },
  infoBox:  { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem" },
  infoT:    { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".4rem" },
  infoV:    { fontSize:".82rem", color:"#0C1A2E", lineHeight:1.5 },
  adminBox: { background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem" },
  adminT:   { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#9A3412", marginBottom:".4rem" },
  adminV:   { fontSize:".82rem", color:"#9A3412", lineHeight:1.5 },
  prelimBox:{ background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:"10px", padding:".85rem 1rem", marginBottom:"1rem" },
  prelimT:  { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#16A34A", marginBottom:".75rem" },
  prelimRow:{ marginBottom:".6rem" },
  prelimLbl:{ fontSize:".68rem", fontWeight:700, color:"#16A34A", textTransform:"uppercase" as const, letterSpacing:".05em", marginBottom:".2rem" },
  prelimVal:{ fontSize:".82rem", color:"#0C1A2E", lineHeight:1.5, background:"#fff", border:"1px solid #86EFAC", borderRadius:"6px", padding:".4rem .6rem" },
  noPrelimt:{ fontSize:".8rem", color:"#5B7EA6", fontStyle:"italic" as const },
  fg:       { marginBottom:".9rem" },
  lbl:      { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  ta:       { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"70px", boxSizing:"border-box" as const },
  upzone:   { border:"2px dashed #BAE6FD", borderRadius:"12px", padding:"1.5rem", textAlign:"center" as const, cursor:"pointer", background:"#F0F9FF", marginBottom:".9rem" },
  upzoneOk: { border:"2px dashed #4ADE80", borderRadius:"12px", padding:"1.5rem", textAlign:"center" as const, cursor:"pointer", background:"rgba(74,222,128,.04)", marginBottom:".9rem" },
  upi:      { fontSize:"1.5rem", marginBottom:".4rem" },
  uplbl:    { fontSize:".82rem", fontWeight:600, color:"#0C1A2E" },
  upsub:    { fontSize:".72rem", color:"#5B7EA6", marginTop:".2rem" },
  upok:     { fontSize:".82rem", fontWeight:600, color:"#16A34A" },
  btnP:     { padding:".65rem 1.25rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", width:"100%" },
  btnPd:    { opacity:.4, cursor:"not-allowed" as const },
  empty:    { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon:    { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:   { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  esub:     { fontSize:".83rem", color:"#5B7EA6", marginTop:".3rem" },
};

const DEG:Record<string,string>  = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc"};
const PLAN:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Pro"};

export default function AnalystActiveJobs() {
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
      const init: any = {};
      data.data.forEach((j: any) => {
        init[j.id] = { fileUrl:"", notes:"", submitting:false, uploading:false, fileName:"" };
      });
      setState(init);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function upd(id: string, field: string, val: any) {
    setState((prev: any) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  }

  async function handleSubmit(job: any) {
    const s = state[job.id];
    if (!s?.fileUrl) { alert("Please upload the file first."); return; }
    upd(job.id, "submitting", true);
    const res = await fetch("/api/chapters/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId: job.id, fileUrl: s.fileUrl, writerNotes: s.notes||undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.routedToQC ? "Submitted → QC will review before delivery." : "Submitted → Delivered to student!");
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } else {
      alert(data.error);
    }
    upd(job.id, "submitting", false);
  }

  async function handleUpload(jobId: string, file: File) {
    if (file.size > 20*1024*1024) { alert("Max 20MB"); return; }
    upd(jobId, "uploading", true);
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "chapters/submitted");
    const res  = await fetch("/api/upload", { method:"POST", body:fd });
    const data = await res.json();
    if (res.ok) { upd(jobId, "fileUrl", data.url); upd(jobId, "fileName", data.fileName); }
    else alert(data.error||"Upload failed");
    upd(jobId, "uploading", false);
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"AN";
  const nav = NAV.map(item => item.href==="/analyst/jobs/active" ? {...item, badge:jobs.length} : item);

  return (
    <StaffLayout navItems={nav} role="Analyst" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Active Jobs</h1>
        <p style={C.sub}>Upload your completed work and submit.</p>

        <div style={{position:"relative", marginBottom:"1.25rem"}}>
          <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
          <input
            style={{width:"100%",padding:".65rem 1rem .65rem 2.2rem",borderRadius:"10px",border:"1.5px solid #BAE6FD",fontSize:".85rem",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box" as const}}
            placeholder="Search by topic..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>✍️</div>
            <div style={C.etitle}>No active jobs.</div>
            <div style={C.esub}>Start a job from Pending Jobs to see it here.</div>
          </div>
        ) : jobs.map((job: any) => {
          const s    = state[job.id]||{};
          const prel = job.writerPrelimNotes;
          const hasPrelim = prel && (prel.researchObjectives||prel.researchQuestions||prel.hypotheses||prel.scopeOfStudy);
          return (
            <div key={job.id} style={C.card}>
              <div style={C.chead}>
                <div>
                  <div style={C.ctitle}>{job.chapterLabel}</div>
                  <div style={C.cmeta}>{job.topic}</div>
                  <div style={C.cmeta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup} · {PLAN[job.planName]||job.planName}</div>
                </div>
                <span style={C.badge}>In Progress</span>
              </div>

              {/* Student instructions */}
              {job.specialInstructions && (
                <div style={C.infoBox}>
                  <div style={C.infoT}>Student Instructions</div>
                  <div style={C.infoV}>{job.specialInstructions}</div>
                </div>
              )}

              {/* Writer's prelim notes from Chapter 1 */}
              {(job.chapterNumber === 3 || job.chapterNumber === 4) && (
                <div style={C.prelimBox}>
                  <div style={C.prelimT}>📋 Writer's Preliminary Notes (from Chapter 1)</div>
                  {hasPrelim ? (
                    <>
                      {prel.researchObjectives && (
                        <div style={C.prelimRow}>
                          <div style={C.prelimLbl}>Research Objectives</div>
                          <div style={C.prelimVal}>{prel.researchObjectives}</div>
                        </div>
                      )}
                      {prel.researchQuestions && (
                        <div style={C.prelimRow}>
                          <div style={C.prelimLbl}>Research Questions</div>
                          <div style={C.prelimVal}>{prel.researchQuestions}</div>
                        </div>
                      )}
                      {prel.hypotheses && (
                        <div style={C.prelimRow}>
                          <div style={C.prelimLbl}>Hypotheses</div>
                          <div style={C.prelimVal}>{prel.hypotheses}</div>
                        </div>
                      )}
                      {prel.scopeOfStudy && (
                        <div style={C.prelimRow}>
                          <div style={C.prelimLbl}>Scope of Study</div>
                          <div style={C.prelimVal}>{prel.scopeOfStudy}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={C.noPrelimt}>
                      Chapter 1 prelim notes not yet submitted by the writer. Check back after Chapter 1 is submitted.
                    </div>
                  )}
                </div>
              )}

              {/* Guideline files */}
              {job.guidelineFileUrl && (
                <div style={{marginBottom:"1rem"}}>
                  {job.guidelineFileUrl.split(",").map((url: string, i: number) => (
                    <a key={i} href={url.trim()} target="_blank" rel="noreferrer"
                      style={{display:"inline-flex",alignItems:"center",gap:".3rem",fontSize:".78rem",fontWeight:600,color:"#0369A1",textDecoration:"none",marginRight:"1rem"}}>
                      📎 {job.guidelineFileUrl.split(",").length > 1 ? `Guideline File ${i+1}` : "Download Guideline"}
                    </a>
                  ))}
                </div>
              )}

              {/* Upload zone */}
              <div
                style={s.fileUrl ? C.upzoneOk : C.upzone}
                onClick={() => {
                  const inp = document.createElement("input");
                  inp.type = "file"; inp.accept = ".pdf,.doc,.docx";
                  inp.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleUpload(job.id, f);
                  };
                  inp.click();
                }}>
                {s.uploading ? (
                  <div><div style={C.upi}>⏳</div><div style={C.uplbl}>Uploading...</div></div>
                ) : s.fileUrl ? (
                  <div><div style={C.upi}>✅</div><div style={C.upok}>{s.fileName||"File uploaded"}</div><div style={C.upsub}>Tap to replace</div></div>
                ) : (
                  <div>
                    <div style={C.upi}>📄</div>
                    <div style={C.uplbl}>Upload {job.chapterLabel}</div>
                    <div style={C.upsub}>PDF or Word (.docx) · Max 20MB</div>
                  </div>
                )}
              </div>

              <div style={C.fg}>
                <label style={C.lbl}>Notes for Admin (optional)</label>
                <textarea style={C.ta} rows={2} placeholder="Any notes about this chapter..."
                  value={s.notes||""} onChange={e=>upd(job.id,"notes",e.target.value)} />
              </div>

              <button
                style={{...C.btnP,...(!s.fileUrl ? C.btnPd : {})}}
                disabled={!s.fileUrl || s.submitting}
                onClick={() => handleSubmit(job)}>
                {s.submitting ? "Submitting..." : `Submit ${job.chapterLabel} →`}
              </button>
            </div>
          );
        })}
      </div>
    </StaffLayout>
  );
}
