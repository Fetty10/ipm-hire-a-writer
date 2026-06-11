"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";

const C = {
  page:  { maxWidth:"520px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  notice:{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"12px", padding:".9rem 1.25rem", fontSize:".78rem", color:"#0369A1", marginBottom:"1.25rem" },
  warn:  { background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:"12px", padding:".9rem 1.25rem", fontSize:".78rem", color:"#9A3412", marginBottom:"1rem" },
  card:  { background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", boxShadow:"0 4px 24px rgba(14,165,233,.08)", padding:"1.5rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  sel:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, background:"#fff" },
  ta:    { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"100px", boxSizing:"border-box" as const },
  upzone:{ border:"2px dashed #BAE6FD", borderRadius:"12px", padding:"1.25rem", textAlign:"center" as const, cursor:"pointer", background:"#F0F9FF" },
  upi:   { fontSize:"1.3rem", marginBottom:".3rem" },
  uplbl: { fontSize:".8rem", fontWeight:600, color:"#0C1A2E" },
  upsub: { fontSize:".7rem", color:"#5B7EA6", marginTop:".15rem" },
  upok:  { fontSize:".8rem", fontWeight:600, color:"#16A34A" },
  btnP:  { width:"100%", padding:".85rem", borderRadius:"12px", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { background:"#E0F2FE", color:"#5B7EA6", cursor:"not-allowed" as const },
  success:{ textAlign:"center" as const, padding:"2rem" },
  sicon: { fontSize:"2.5rem", marginBottom:"1rem" },
  stitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#0C1A2E", marginBottom:".5rem" },
  ssub:  { fontSize:".83rem", color:"#5B7EA6", lineHeight:1.6 },
};

export default function StudentCorrections() {
  const [orders,    setOrders]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [success,   setSuccess]   = useState(false);
  const [orderId,   setOrderId]   = useState("");
  const [chapterId, setChapterId] = useState("");
  const [request,   setRequest]   = useState("");
  const [supUrl,    setSupUrl]    = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(()=>{
    fetch("/api/student/orders?filter=completed").then(r=>r.json()).then(d=>{ if(d.success) setOrders(d.data); setLoading(false); });
  },[]);

  const selOrder = orders.find(o=>o.id===orderId);
  const isBasic  = selOrder?.planName==="BASIC";

  async function handleSupUpload(file:File) {
    if(file.size>20*1024*1024){ alert("Max 20MB"); return; }
    setUploading(true);
    const fd=new FormData(); fd.append("file",file); fd.append("folder","orders/supervisor-notes");
    const res  = await fetch("/api/upload",{method:"POST",body:fd});
    const data = await res.json();
    if(res.ok) setSupUrl(data.url); else alert(data.error||"Upload failed");
    setUploading(false);
  }

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    if(!chapterId) { alert("Select a chapter."); return; }
    if(!request.trim()) { alert("Describe what needs to be corrected."); return; }
    setSubmitting(true);
    const res  = await fetch("/api/chapters/corrections",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chapterId,correctionRequest:request,supervisorNotesUrl:supUrl||undefined})});
    const data = await res.json();
    if(res.ok) setSuccess(true); else alert(data.error);
    setSubmitting(false);
  }

  return (
    <StudentLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Request a Correction</h1>
        <p style={C.sub}>Not satisfied with a chapter? Let us know and we'll fix it.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : success ? (
          <div style={C.card}>
            <div style={C.success}>
              <div style={C.sicon}>✅</div>
              <div style={C.stitle}>Correction Submitted!</div>
              <div style={C.ssub}>Our QC team will review your request and send back the corrected chapter. You'll be notified once it's ready.</div>
            </div>
          </div>
        ) : (
          <>
            <div style={C.notice}>ℹ Corrections are <strong>free</strong> on Standard and Professional plans. Your request goes to our QC team.</div>
            <div style={C.card}>
              <form onSubmit={submit}>
                <div style={C.fg}>
                  <label style={C.lbl}>Which Order?</label>
                  <select style={C.sel} value={orderId} onChange={e=>{setOrderId(e.target.value);setChapterId("");}}>
                    <option value="">-- Select an order --</option>
                    {orders.map(o=><option key={o.id} value={o.id}>{o.topic} ({o.planName})</option>)}
                  </select>
                </div>

                {isBasic && orderId && (
                  <div style={C.warn}>⚠ Your order is on the <strong>Basic plan</strong> which does not include free corrections. A correction fee will apply.</div>
                )}

                {selOrder && (
                  <div style={C.fg}>
                    <label style={C.lbl}>Which Chapter?</label>
                    <select style={C.sel} value={chapterId} onChange={e=>setChapterId(e.target.value)}>
                      <option value="">-- Select a chapter --</option>
                      {selOrder.chapters?.map((ch:any)=><option key={ch.id} value={ch.id}>{ch.chapterLabel}</option>)}
                    </select>
                  </div>
                )}

                <div style={C.fg}>
                  <label style={C.lbl}>What Needs to Be Corrected?</label>
                  <textarea style={C.ta} value={request} onChange={e=>setRequest(e.target.value)} rows={4}
                    placeholder="Be specific. e.g. The introduction doesn't mention Nigeria. Please add the Nigerian context in section 1.2. Also, all references should be APA 7th edition." />
                </div>

                <div style={C.fg}>
                  <label style={C.lbl}>Upload Supervisor's Notes <span style={{fontWeight:400,textTransform:"none" as const,letterSpacing:0}}>(optional)</span></label>
                  <div style={C.upzone} onClick={()=>{const inp=document.createElement("input");inp.type="file";inp.accept=".pdf,.doc,.docx";inp.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleSupUpload(f);};inp.click();}}>
                    {uploading ? <div><div style={C.upi}>⏳</div><div style={C.uplbl}>Uploading...</div></div>
                    : supUrl   ? <div><div style={C.upi}>✅</div><div style={C.upok}>Notes uploaded</div><div style={C.upsub}>Tap to replace</div></div>
                    : <div><div style={C.upi}>📎</div><div style={C.uplbl}>Upload supervisor's comments</div><div style={C.upsub}>PDF or Word · Max 20MB</div></div>}
                  </div>
                </div>

                <button type="submit" disabled={submitting||!chapterId||!request.trim()} style={{...C.btnP,...(!chapterId||!request.trim()||submitting?C.btnD:{})}}>
                  {submitting?"Submitting...":"Submit Correction Request →"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
