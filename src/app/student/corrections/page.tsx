"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";

const C = {
  page:  { maxWidth:"560px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  tabs:  { display:"flex", gap:".5rem", marginBottom:"1.5rem" },
  tab:   { padding:".55rem 1.25rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontWeight:700, cursor:"pointer", background:"#fff", color:"#5B7EA6", fontFamily:"'DM Sans',sans-serif" },
  tabA:  { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  // Request form styles
  notice:{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"12px", padding:".9rem 1.25rem", marginBottom:"1.25rem", fontSize:".78rem", color:"#0369A1" },
  card:  { background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", boxShadow:"0 4px 24px rgba(14,165,233,.08)", padding:"1.5rem", marginBottom:"1rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  sel:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, background:"#fff" },
  ta:    { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"100px", boxSizing:"border-box" as const },
  upzone:{ border:"2px dashed #BAE6FD", borderRadius:"12px", padding:"1.25rem", textAlign:"center" as const, cursor:"pointer", background:"#F0F9FF" },
  upzoneOk:{ border:"2px dashed #4ADE80", borderRadius:"12px", padding:"1.25rem", textAlign:"center" as const, cursor:"pointer", background:"rgba(74,222,128,.04)" },
  upi:   { fontSize:"1.3rem", marginBottom:".3rem" },
  uplbl: { fontSize:".8rem", fontWeight:600, color:"#0C1A2E" },
  upok:  { fontSize:".8rem", fontWeight:600, color:"#16A34A" },
  upsub: { fontSize:".7rem", color:"#5B7EA6", marginTop:".15rem" },
  btnP:  { width:"100%", padding:".85rem", borderRadius:"12px", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { background:"#E0F2FE", color:"#5B7EA6", cursor:"not-allowed" as const },
  success:{ textAlign:"center" as const, padding:"2rem" },
  sicon: { fontSize:"2.5rem", marginBottom:"1rem" },
  stitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#0C1A2E", marginBottom:".5rem" },
  ssub:  { fontSize:".83rem", color:"#5B7EA6", lineHeight:1.6, marginBottom:"1rem" },
  btnO:  { padding:".65rem 1.25rem", borderRadius:"10px", background:"#fff", color:"#0369A1", fontSize:".82rem", fontWeight:700, border:"1.5px solid #38BDF8", cursor:"pointer" },
  // Status list styles
  scard: { background:"#fff", borderRadius:"14px", border:"1.5px solid #E0F2FE", padding:"1rem 1.25rem", marginBottom:".75rem" },
  schead:{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:".75rem" },
  sctitle:{ fontFamily:"'Syne',sans-serif", fontSize:".88rem", fontWeight:700, color:"#0C1A2E" },
  scmeta:{ fontSize:".75rem", color:"#5B7EA6", marginTop:".2rem" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, flexShrink:0 as const },
  req:   { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"8px", padding:".65rem .9rem", fontSize:".78rem", color:"#5B7EA6", marginBottom:".75rem", lineHeight:1.5 },
  reqt:  { fontSize:".62rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".3rem" },
  dlBtn: { fontSize:".75rem", fontWeight:600, color:"#0369A1", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" },
  empty: { textAlign:"center" as const, padding:"3rem 1rem" },
  eicon: { fontSize:"2rem", marginBottom:".5rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
};

function getStatusInfo(status: string) {
  switch(status) {
    case "QC_IN_PROGRESS": return { label:"With QC Team", bg:"#E0F2FE", color:"#0369A1" };
    case "IN_PROGRESS":    return { label:"With Writer",  bg:"#FEF9C3", color:"#854D0E" };
    case "DELIVERED":      return { label:"Corrected ✓",  bg:"#D1FAE5", color:"#065F46" };
    default:               return { label:"In Review",    bg:"#F1F5F9", color:"#64748B" };
  }
}

export default function StudentCorrections() {
  const [tab,       setTab]       = useState<"request"|"status">("status");
  const [orders,    setOrders]    = useState<any[]>([]);
  const [corrs,     setCorrs]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [success,   setSuccess]   = useState(false);
  const [orderId,   setOrderId]   = useState("");
  const [chapterId, setChapterId] = useState("");
  const [request,   setRequest]   = useState("");
  const [attachments, setAttachments] = useState<{url:string,name:string,type:string}[]>([]);
  const [uploading,   setUploading]   = useState(false);

  useEffect(()=>{
    Promise.all([
      fetch("/api/student/orders?filter=completed").then(r=>r.json()),
      fetch("/api/student/corrections").then(r=>r.json()),
    ]).then(([oData, cData])=>{
      if(oData.success) setOrders(oData.data);
      if(cData.success) setCorrs(cData.data);
    }).finally(()=>setLoading(false));
  },[]);

  const selOrder = orders.find(o=>o.id===orderId);

  async function handleAttachFile(file:File) {
    if(attachments.length>=10){ toast.error("Max 10 files."); return; }
    if(file.size>20*1024*1024){ toast.error("Max 20MB per file."); return; }
    setUploading(true);
    const fd=new FormData(); fd.append("file",file); fd.append("folder","orders/corrections");
    const res  = await fetch("/api/upload",{method:"POST",body:fd});
    const data = await res.json();
    if(res.ok){
      const isImg   = file.type.startsWith("image/");
      const isAudio = file.type.startsWith("audio/") || file.type === "video/webm";
      const type    = isImg ? "image" : isAudio ? "audio" : "doc";
      setAttachments(prev=>[...prev,{url:data.url,name:file.name,type}]);
    } else toast.error(data.error||"Upload failed");
    setUploading(false);
  }
  function openPicker(){
    const inp=document.createElement("input"); inp.type="file"; inp.multiple=true;
    inp.accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.mp3,.m4a,.wav,.ogg,.webm,.aac";
    inp.onchange=async(e)=>{
      const files=Array.from((e.target as HTMLInputElement).files||[]);
      for(const f of files) await handleAttachFile(f);
    };
    inp.click();
  }

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    if(!chapterId){ toast.error("Select a chapter."); return; }
    if(!request.trim()){ toast.error("Describe what needs to be corrected."); return; }
    setSubmitting(true);
    const res  = await fetch("/api/chapters/corrections",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chapterId,correctionRequest:request,supervisorNotesUrl:attachments.length>0?attachments.map(a=>a.url).join(","):undefined})});
    const data = await res.json();
    if(res.ok){ setSuccess(true); }
    else toast.error(data.error || "Something went wrong");
    setSubmitting(false);
  }

  return (
    <StudentLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Corrections</h1>
        <p style={C.sub}>Request corrections or track existing ones.</p>

        {/* Tabs */}
        <div style={C.tabs}>
          <button style={{...C.tab,...(tab==="status"?C.tabA:{})}} onClick={()=>setTab("status")}>
            📋 My Correction Requests {corrs.length>0?`(${corrs.length})`:""}
          </button>
          <button style={{...C.tab,...(tab==="request"?C.tabA:{})}} onClick={()=>{ setSuccess(false); setTab("request"); }}>
            ➕ New Request
          </button>
        </div>

        {/* Status tab */}
        {tab==="status" && (
          loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
          : corrs.length===0 ? (
            <div style={C.empty}>
              <div style={C.eicon}>📭</div>
              <div style={C.etitle}>No correction requests yet.</div>
            </div>
          ) : corrs.map((c:any)=>{
            const s = getStatusInfo(c.status);
            return (
              <div key={c.id} style={C.scard}>
                <div style={C.schead}>
                  <div>
                    <div style={C.sctitle}>{c.chapterLabel}</div>
                    <div style={C.scmeta}>{c.topic}</div>
                    <div style={C.scmeta}>{c.routedToQcAt?`Submitted: ${new Date(c.routedToQcAt).toLocaleDateString("en-NG")}`:""}</div>
                  </div>
                  <span style={{...C.badge,background:s.bg,color:s.color}}>{s.label}</span>
                </div>
                <div style={C.req}>
                  <div style={C.reqt}>Your Request</div>
                  {c.correctionNotes}
                </div>
                {c.status==="DELIVERED" && c.deliveredFileUrl && (
                  <button style={C.dlBtn} onClick={()=>window.open(c.deliveredFileUrl,"_blank")}>
                    ⬇ Download Corrected Chapter
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Request tab */}
        {tab==="request" && (
          success ? (
            <div style={C.card}>
              <div style={C.success}>
                <div style={C.sicon}>✅</div>
                <div style={C.stitle}>Request Submitted!</div>
                <div style={C.ssub}>Our QC team will review and fix it. You'll get an email and notification when it's ready.</div>
                <button style={C.btnO} onClick={()=>{ setSuccess(false); setTab("status"); }}>View My Requests →</button>
              </div>
            </div>
          ) : (
            <>
              <div style={C.notice}>ℹ Corrections are free on Standard and Professional plans. Describe clearly what needs to be fixed.</div>
              <div style={C.card}>
                <form onSubmit={submit}>
                  <div style={C.fg}>
                    <label style={C.lbl}>Which Order?</label>
                    <select style={C.sel} value={orderId} onChange={e=>{setOrderId(e.target.value);setChapterId("");}}>
                      <option value="">-- Select an order --</option>
                      {orders.map(o=><option key={o.id} value={o.id}>{o.topic} ({o.planName})</option>)}
                    </select>
                  </div>
                  {selOrder && (
                    <div style={C.fg}>
                      <label style={C.lbl}>Which Chapter?</label>
                      <select style={C.sel} value={chapterId} onChange={e=>setChapterId(e.target.value)}>
                        <option value="">-- Select a chapter --</option>
                        {selOrder.chapters?.filter((ch:any)=>ch.status==="DELIVERED").map((ch:any)=>(
                          <option key={ch.id} value={ch.id}>{ch.chapterLabel}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div style={C.fg}>
                    <label style={C.lbl}>What Needs to Be Corrected?</label>
                    <textarea style={C.ta} value={request} onChange={e=>setRequest(e.target.value)} rows={4}
                      placeholder="Be specific. e.g. The introduction doesn't mention Nigeria. Please add context in section 1.2. References should be APA 7th edition." />
                  </div>
                  <div style={C.fg}>
                    <label style={C.lbl}>Attachments <span style={{fontWeight:400,textTransform:"none" as const,letterSpacing:0}}>(optional — screenshots, voice notes, supervisor notes, PDFs)</span></label>
                    {/* Uploaded files */}
                    {attachments.length>0 && (
                      <div style={{display:"flex",flexDirection:"column" as const,gap:".4rem",marginBottom:".6rem"}}>
                        {attachments.map((a,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:".5rem",background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:"8px",padding:".5rem .75rem"}}>
                            <span>{a.type==="image"?"🖼️":a.type==="audio"?"🎙️":"📎"}</span>
                            <span style={{flex:1,fontSize:".78rem",color:"#0C1A2E",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{a.name}</span>
                            <button type="button" style={{background:"none",border:"none",cursor:"pointer",color:"#DC2626",fontWeight:700}}
                              onClick={()=>setAttachments(prev=>prev.filter((_,j)=>j!==i))}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {attachments.length<10 && (
                      <div style={C.upzone} onClick={openPicker}>
                        {uploading
                          ? <div><div style={C.upi}>⏳</div><div style={C.uplbl}>Uploading...</div></div>
                          : <div><div style={C.upi}>📎</div>
                              <div style={C.uplbl}>{attachments.length>0?"Add More Files":"Add Screenshots or Files"}</div>
                              <div style={C.upsub}>Images, Voice Notes, PDF, Word · Max 20MB each · Up to 10 files</div>
                            </div>}
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={submitting||!chapterId||!request.trim()}
                    style={{...C.btnP,...(!chapterId||!request.trim()||submitting?C.btnD:{})}}>
                    {submitting?"Submitting...":"Submit Correction Request →"}
                  </button>
                </form>
              </div>
            </>
          )
        )}
      </div>
    </StudentLayout>
  );
}
