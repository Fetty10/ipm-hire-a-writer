"use client";
// src/components/student/AddChaptersModal.tsx
// Reusable modal for adding chapters to an existing order

import { useEffect, useState } from "react";

const CH_LABELS = ["","Chapter 1","Chapter 2","Chapter 3","Chapter 4","Chapter 5"];
const PLAN_LBL:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Pro"};

const C = {
  overlay: { position:"fixed" as const, inset:0, background:"rgba(12,26,46,.7)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" },
  modal:   { background:"#fff", borderRadius:"20px", width:"100%", maxWidth:"480px", maxHeight:"90vh", overflowY:"auto" as const, boxShadow:"0 20px 60px rgba(0,0,0,.3)" },
  head:    { padding:"1.25rem 1.5rem", borderBottom:"1px solid #E0F2FE", display:"flex", alignItems:"center", justifyContent:"space-between" },
  title:   { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:800, color:"#0C1A2E" },
  close:   { background:"none", border:"none", fontSize:"1.25rem", cursor:"pointer", color:"#5B7EA6", padding:0 },
  body:    { padding:"1.5rem" },
  topic:   { fontSize:".78rem", color:"#5B7EA6", marginBottom:"1rem", background:"#F0F9FF", padding:".65rem 1rem", borderRadius:"10px", borderLeft:"3px solid #38BDF8" },
  info:    { fontSize:".72rem", color:"#0369A1", fontWeight:600 },
  lbl:     { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".6rem" },
  chips:   { display:"flex", gap:".4rem", flexWrap:"wrap" as const, marginBottom:"1.25rem" },
  chip:    { padding:".45rem .9rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontWeight:600, cursor:"pointer", color:"#5B7EA6", background:"none", fontFamily:"'DM Sans',sans-serif" },
  chipA:   { borderColor:"#38BDF8", background:"#E0F2FE", color:"#0C1A2E" },
  chipX:   { borderColor:"#E0F2FE", background:"#F8FBFF", color:"#CBD5E1", cursor:"not-allowed" as const },
  upzone:  { border:"2px dashed #BAE6FD", borderRadius:"12px", padding:"1rem", textAlign:"center" as const, cursor:"pointer", background:"#F0F9FF", marginBottom:"1.25rem", transition:"all .2s" },
  upzoneOk:{ border:"2px dashed #4ADE80", borderRadius:"12px", padding:"1rem", textAlign:"center" as const, cursor:"pointer", background:"rgba(74,222,128,.04)", marginBottom:"1.25rem" },
  upi:     { fontSize:"1.1rem", marginBottom:".2rem" },
  uplbl:   { fontSize:".78rem", fontWeight:600, color:"#0C1A2E" },
  upok:    { fontSize:".78rem", fontWeight:600, color:"#16A34A" },
  upsub:   { fontSize:".68rem", color:"#5B7EA6", marginTop:".15rem" },
  sum:     { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"12px", padding:"1rem", marginBottom:"1.25rem" },
  sumRow:  { display:"flex", justifyContent:"space-between", fontSize:".82rem", marginBottom:".3rem" },
  sumLbl:  { color:"#5B7EA6" },
  sumVal:  { fontWeight:600, color:"#0C1A2E" },
  sumTotal:{ display:"flex", justifyContent:"space-between", fontWeight:700, borderTop:"1px solid #BAE6FD", paddingTop:".6rem", marginTop:".4rem" },
  sumPrice:{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#0284C7" },
  btnP:    { width:"100%", padding:".85rem", borderRadius:"12px", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:    { background:"#E0F2FE", color:"#5B7EA6", cursor:"not-allowed" as const },
  btnO:    { width:"100%", padding:".75rem", borderRadius:"12px", background:"#fff", color:"#5B7EA6", fontSize:".85rem", fontWeight:600, border:"1.5px solid #E0F2FE", cursor:"pointer", marginTop:".5rem", fontFamily:"'DM Sans',sans-serif" },
};

interface Props {
  orderId: string;
  onClose: () => void;
}

export default function AddChaptersModal({ orderId, onClose }: Props) {
  const [info,       setInfo]       = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<number[]>([]);
  const [guideUrl,   setGuideUrl]   = useState("");
  const [guideName,  setGuideName]  = useState("");
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/add-chapters?orderId=${orderId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setInfo(d.data); })
      .finally(() => setLoading(false));
  }, [orderId]);

  function toggle(n: number) {
    setSelected(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]);
  }

  async function handleUpload(file: File) {
    if (file.size > 20*1024*1024) { alert("Max 20MB"); return; }
    setUploading(true);
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "orders/guidelines");
    const res  = await fetch("/api/upload", { method:"POST", body:fd });
    const data = await res.json();
    if (res.ok) { setGuideUrl(data.url); setGuideName(data.fileName||file.name); }
    else alert(data.error||"Upload failed");
    setUploading(false);
  }

  async function handlePay() {
    if (!selected.length) return;
    setSubmitting(true);
    const res  = await fetch("/api/orders/add-chapters", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, chaptersRequested: selected, guidelineFileUrl: guideUrl||undefined }),
    });
    const data = await res.json();
    if (res.ok) window.location.href = data.paymentUrl;
    else { alert(data.error); setSubmitting(false); }
  }

  const total = info ? (info.pricingType === "PER_CHAPTER" ? info.pricePerChapter * selected.length : info.pricePerChapter) : 0;

  return (
    <div style={C.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={C.modal}>
        <div style={C.head}>
          <span style={C.title}>Add More Chapters</span>
          <button style={C.close} onClick={onClose}>×</button>
        </div>
        <div style={C.body}>
          {loading ? (
            <div style={{textAlign:"center",padding:"2rem",color:"#5B7EA6"}}>Loading...</div>
          ) : !info ? (
            <div style={{textAlign:"center",padding:"2rem",color:"#EF4444"}}>Failed to load order info.</div>
          ) : (
            <>
              <div style={C.topic}>
                <div style={{fontWeight:700,color:"#0C1A2E",fontSize:".85rem",marginBottom:".25rem"}}>{info.topic}</div>
                <div style={C.info}>{PLAN_LBL[info.planName]||info.planName} Plan · Same plan will apply to new chapters</div>
              </div>

              {info.availableChapters.length === 0 ? (
                <div style={{textAlign:"center",padding:"1.5rem",color:"#5B7EA6",fontSize:".85rem"}}>
                  All 5 chapters have already been ordered for this topic.
                </div>
              ) : (
                <>
                  <label style={C.lbl}>Select Chapters to Add</label>
                  <div style={C.chips}>
                    {[1,2,3,4,5].map(n => {
                      const already = info.existingChapters.includes(n);
                      const active  = selected.includes(n);
                      return (
                        <button key={n} type="button"
                          style={{...C.chip,...(already?C.chipX:active?C.chipA:{})}}
                          disabled={already}
                          onClick={()=>!already&&toggle(n)}>
                          {CH_LABELS[n]} {already?"✓":""}
                        </button>
                      );
                    })}
                  </div>
                  {selected.length > 0 && (
                    <p style={{fontSize:".75rem",color:"#0369A1",fontWeight:600,marginBottom:"1.25rem"}}>
                      {selected.length} chapter{selected.length>1?"s":""} selected
                    </p>
                  )}

                  {/* Optional guideline upload */}
                  <label style={C.lbl}>Upload New Format/Guideline <span style={{fontWeight:400,textTransform:"none" as const,letterSpacing:0,color:"#5B7EA6"}}>(optional)</span></label>
                  <div style={guideUrl ? C.upzoneOk : C.upzone}
                    onClick={() => { const inp=document.createElement("input");inp.type="file";inp.accept=".pdf,.doc,.docx";inp.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleUpload(f);};inp.click(); }}>
                    {uploading ? <div><div style={C.upi}>⏳</div><div style={C.uplbl}>Uploading...</div></div>
                    : guideUrl  ? <div><div style={C.upi}>✅</div><div style={C.upok}>{guideName}</div><div style={C.upsub}>Tap to replace</div></div>
                    : <div><div style={C.upi}>📎</div><div style={C.uplbl}>Upload guideline</div><div style={C.upsub}>PDF or Word · Max 20MB</div></div>}
                  </div>

                  {/* Summary */}
                  {selected.length > 0 && (
                    <div style={C.sum}>
                      <div style={C.sumRow}><span style={C.sumLbl}>Plan</span><span style={C.sumVal}>{PLAN_LBL[info.planName]||info.planName}</span></div>
                      <div style={C.sumRow}><span style={C.sumLbl}>Chapters</span><span style={C.sumVal}>{selected.sort().map(n=>`Ch ${n}`).join(", ")}</span></div>
                      {info.pricingType==="PER_CHAPTER"&&<div style={C.sumRow}><span style={C.sumLbl}>Price per chapter</span><span style={C.sumVal}>₦{info.pricePerChapter.toLocaleString()}</span></div>}
                      <div style={C.sumTotal}><span>Total</span><span style={C.sumPrice}>₦{total.toLocaleString()}</span></div>
                    </div>
                  )}

                  <button style={{...C.btnP,...(!selected.length||submitting?C.btnD:{})}}
                    disabled={!selected.length||submitting||uploading}
                    onClick={handlePay}>
                    {submitting?"Processing...":selected.length?`💳 Pay ₦${total.toLocaleString()} →`:"Select chapters above"}
                  </button>
                  <button style={C.btnO} onClick={onClose}>Cancel</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
