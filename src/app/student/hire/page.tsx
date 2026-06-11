"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/student/StudentLayout";

const DEG_GROUPS = [
  {value:"OND_HND_NCE",label:"HND | OND | NCE"},
  {value:"BSC_BED_BA", label:"BSc | BEd | BA | BTech | BEng | Nursing"},
  {value:"PGD_MSC_PHD",label:"PGD | MSc | MBA | MBBS | LL.B | PhD"},
];
const SERVICES = [
  {value:"project",  label:"Project / Thesis / Dissertation", hasPlan:true},
  {value:"seminar",  label:"Seminar Paper",                   hasPlan:false},
  {value:"proposal", label:"Research Proposal",               hasPlan:false},
  {value:"journal",  label:"Journal / Article",               hasPlan:false},
  {value:"topic",    label:"Topic Coining",                   hasPlan:false},
  {value:"assignment",label:"Assignment",                     hasPlan:false},
];
const FLAT:Record<string,Record<string,number>> = {
  seminar:    {OND_HND_NCE:10000,BSC_BED_BA:10000,PGD_MSC_PHD:20000},
  proposal:   {OND_HND_NCE:10000,BSC_BED_BA:10000,PGD_MSC_PHD:20000},
  journal:    {OND_HND_NCE:10000,BSC_BED_BA:10000,PGD_MSC_PHD:20000},
  topic:      {OND_HND_NCE:2000, BSC_BED_BA:2000, PGD_MSC_PHD:2000 },
  assignment: {OND_HND_NCE:3000, BSC_BED_BA:3000, PGD_MSC_PHD:5000 },
};
const PLAN_LBL:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Professional"};
const CH_LBL = ["Chapter 1","Chapter 2","Chapter 3","Chapter 4","Chapter 5"];

const C = {
  page:  { maxWidth:"520px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", boxShadow:"0 4px 24px rgba(14,165,233,.08)", padding:"1.5rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  sel:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, background:"#fff" },
  ta:    { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"80px", boxSizing:"border-box" as const },
  planRow:{ display:"flex", flexDirection:"column" as const, gap:".6rem", marginBottom:".5rem" },
  plan:  { border:"1.5px solid #BAE6FD", borderRadius:"12px", padding:".9rem 1rem", cursor:"pointer", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"space-between" },
  planA: { borderColor:"#38BDF8", background:"#F0F9FF" },
  pname: { fontFamily:"'Syne',sans-serif", fontSize:".85rem", fontWeight:700, color:"#0C1A2E" },
  pprice:{ fontSize:".82rem", color:"#5B7EA6", marginTop:".15rem" },
  radio: { width:"18px", height:"18px", borderRadius:"50%", border:"2px solid #BAE6FD", flexShrink:0, transition:"all .2s" },
  radioA:{ borderColor:"#38BDF8", background:"#38BDF8" },
  chips: { display:"flex", gap:".4rem", flexWrap:"wrap" as const, marginBottom:".5rem" },
  chip:  { padding:".45rem .9rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontWeight:600, cursor:"pointer", transition:"all .2s", color:"#5B7EA6" },
  chipA: { borderColor:"#38BDF8", background:"#E0F2FE", color:"#0C1A2E" },
  sum:   { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"12px", padding:"1rem 1.25rem", marginBottom:"1rem" },
  sumT:  { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".75rem" },
  sumR:  { display:"flex", justifyContent:"space-between", fontSize:".82rem", marginBottom:".4rem" },
  sumRL: { color:"#5B7EA6" },
  sumRV: { fontWeight:600, color:"#0C1A2E" },
  sumTotal:{ display:"flex", justifyContent:"space-between", fontSize:".88rem", fontWeight:700, borderTop:"1px solid #BAE6FD", paddingTop:".75rem", marginTop:".5rem" },
  sumPrice:{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:"#0284C7" },
  btnP:  { width:"100%", padding:".85rem", borderRadius:"12px", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .2s" },
  btnD:  { background:"#E0F2FE", color:"#5B7EA6", cursor:"not-allowed" as const },
  foot:  { textAlign:"center" as const, fontSize:".72rem", color:"#5B7EA6", marginTop:".75rem" },
  upzone:{ border:"2px dashed #BAE6FD", borderRadius:"12px", padding:"1.25rem", textAlign:"center" as const, cursor:"pointer", background:"#F0F9FF" },
  upi:   { fontSize:"1.3rem", marginBottom:".3rem" },
  uplbl: { fontSize:".8rem", fontWeight:600, color:"#0C1A2E" },
  upsub: { fontSize:".7rem", color:"#5B7EA6", marginTop:".15rem" },
  upok:  { fontSize:".8rem", fontWeight:600, color:"#16A34A" },
  planTags:{ display:"flex", gap:".4rem", marginTop:".5rem", flexWrap:"wrap" as const },
  tag:   { padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700, background:"#E0F2FE", color:"#0369A1" },
};

export default function HireAWriter() {
  const router = useRouter();
  const [plans,    setPlans]    = useState<any[]>([]);
  const [deg,      setDeg]      = useState("");
  const [svc,      setSvc]      = useState("");
  const [planId,   setPlanId]   = useState("");
  const [chapters, setChapters] = useState<number[]>([]);
  const [topic,    setTopic]    = useState("");
  const [dept,     setDept]     = useState("");
  const [notes,    setNotes]    = useState("");
  const [guideUrl, setGuideUrl] = useState("");
  const [uploading,setUploading]= useState(false);
  const [loading,  setLoading]  = useState(false);

  useEffect(()=>{
    if(!deg) { setPlans([]); return; }
    fetch(`/api/plans?degreeGroup=${deg}`).then(r=>r.json()).then(d=>{ if(d.success) setPlans(d.data); });
  },[deg]);

  const selSvc   = SERVICES.find(s=>s.value===svc);
  const selPlan  = plans.find(p=>p.id===planId);
  const isProj   = svc==="project";
  const perCh    = selPlan?.pricingType==="PER_CHAPTER";
  const showSum  = deg && svc && (isProj ? planId && (!perCh || chapters.length>0) : true);

  function calcTotal() {
    if(!deg) return 0;
    if(!isProj) return FLAT[svc]?.[deg]||0;
    if(!selPlan) return 0;
    if(!perCh) return selPlan.priceKobo/100;
    return (selPlan.priceKobo/100)*chapters.length;
  }

  function toggleCh(n:number) {
    setChapters(prev=>prev.includes(n)?prev.filter(c=>c!==n):[...prev,n]);
  }

  async function handleGuideUpload(file:File) {
    if(file.size>20*1024*1024){ alert("Max 20MB"); return; }
    setUploading(true);
    const fd = new FormData(); fd.append("file",file); fd.append("folder","orders/guidelines");
    const res  = await fetch("/api/upload",{method:"POST",body:fd});
    const data = await res.json();
    if(res.ok) setGuideUrl(data.url); else alert(data.error||"Upload failed");
    setUploading(false);
  }

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    if(!deg)   { alert("Select academic level."); return; }
    if(!svc)   { alert("Select service type."); return; }
    if(isProj&&!planId) { alert("Choose a plan."); return; }
    if(isProj&&perCh&&chapters.length===0) { alert("Select at least one chapter."); return; }
    if(!topic.trim()) { alert("Enter your topic."); return; }
    setLoading(true);
    const res  = await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      planId:isProj?planId:"flat", topic:topic.trim(), department:dept.trim(), degreeGroup:deg,
      specialInstructions:notes.trim()||undefined, guidelineFileUrl:guideUrl||undefined,
      chaptersRequested:isProj&&perCh?chapters:undefined, serviceType:svc.toUpperCase(),
    })});
    const data = await res.json();
    if(res.ok) window.location.href=data.paymentUrl;
    else { alert(data.error); setLoading(false); }
  }

  return (
    <StudentLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Hire a Writer</h1>
        <p style={C.sub}>Fill in the form and we'll assign the right expert to your work.</p>

        <form onSubmit={submit} style={C.card}>
          {/* Academic Level */}
          <div style={C.fg}>
            <label style={C.lbl}>Academic Level</label>
            <select style={C.sel} value={deg} onChange={e=>{setDeg(e.target.value);setPlanId("");setChapters([]);}}>
              <option value="">-- Select your level --</option>
              {DEG_GROUPS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {/* Service */}
          <div style={C.fg}>
            <label style={C.lbl}>What Do You Need?</label>
            <select style={C.sel} value={svc} onChange={e=>{setSvc(e.target.value);setPlanId("");setChapters([]);}}>
              <option value="">-- Select service type --</option>
              {SERVICES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Plans */}
          {isProj && deg && (
            <div style={C.fg}>
              <label style={C.lbl}>Choose a Plan</label>
              <div style={C.planRow}>
                {plans.map(p=>(
                  <div key={p.id} style={{...C.plan,...(planId===p.id?C.planA:{})}} onClick={()=>{setPlanId(p.id);setChapters([]);}}>
                    <div>
                      <div style={C.pname}>{PLAN_LBL[p.planName]||p.planName}</div>
                      <div style={C.pprice}>₦{(p.priceKobo/100).toLocaleString()} {p.pricingType==="PER_CHAPTER"?"per chapter":"(complete project)"}</div>
                      <div style={C.planTags}>
                        {p.includesCorrections&&<span style={C.tag}>Corrections ✓</span>}
                        {p.includesPlagiarismCheck&&<span style={{...C.tag,background:"#EDE9FE",color:"#5B21B6"}}>Plagiarism Check ✓</span>}
                      </div>
                    </div>
                    <div style={{...C.radio,...(planId===p.id?C.radioA:{})}}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapter selector */}
          {isProj && perCh && planId && (
            <div style={C.fg}>
              <label style={C.lbl}>Which Chapters? <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(select all you need)</span></label>
              <div style={C.chips}>
                {CH_LBL.map((label,i)=>{
                  const n=i+1;
                  return <button type="button" key={n} style={{...C.chip,...(chapters.includes(n)?C.chipA:{})}} onClick={()=>toggleCh(n)}>{label}</button>;
                })}
              </div>
              {chapters.length>0&&<p style={{fontSize:".75rem",color:"#0369A1",fontWeight:600}}>{chapters.length} chapter{chapters.length>1?"s":""} selected</p>}
            </div>
          )}

          {/* Topic */}
          <div style={C.fg}>
            <label style={C.lbl}>Your Topic</label>
            <input style={C.inp} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Impact of Digital Marketing on Consumer Behaviour in Nigeria" />
          </div>

          {/* Department */}
          {svc!=="topic" && (
            <div style={C.fg}>
              <label style={C.lbl}>Department / Course</label>
              <input style={C.inp} value={dept} onChange={e=>setDept(e.target.value)} placeholder="e.g. Business Administration" />
            </div>
          )}

          {/* Notes */}
          <div style={C.fg}>
            <label style={C.lbl}>Special Instructions <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
            <textarea style={C.ta} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Use APA 7th edition. Focus on Nigerian context." rows={3} />
          </div>

          {/* Upload */}
          <div style={C.fg}>
            <label style={C.lbl}>Upload School Format/Guideline <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional)</span></label>
            <div style={C.upzone} onClick={()=>{ const inp=document.createElement("input");inp.type="file";inp.accept=".pdf,.doc,.docx";inp.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleGuideUpload(f);};inp.click(); }}>
              {uploading ? <div><div style={C.upi}>⏳</div><div style={C.uplbl}>Uploading...</div></div>
              : guideUrl  ? <div><div style={C.upi}>✅</div><div style={C.upok}>File uploaded</div><div style={C.upsub}>Tap to replace</div></div>
              : <div><div style={C.upi}>📎</div><div style={C.uplbl}>Upload your format guide</div><div style={C.upsub}>PDF or Word · Max 20MB</div></div>}
            </div>
          </div>

          {/* Summary */}
          {showSum && (
            <div style={C.sum}>
              <div style={C.sumT}>Order Summary</div>
              <div style={C.sumR}><span style={C.sumRL}>Service</span><span style={C.sumRV}>{selSvc?.label||svc}</span></div>
              {isProj&&selPlan&&<div style={C.sumR}><span style={C.sumRL}>Plan</span><span style={C.sumRV}>{PLAN_LBL[selPlan.planName]||selPlan.planName}</span></div>}
              {isProj&&perCh&&chapters.length>0&&<div style={C.sumR}><span style={C.sumRL}>Chapters</span><span style={C.sumRV}>{chapters.sort().map(n=>`Ch ${n}`).join(", ")}</span></div>}
              <div style={C.sumTotal}><span>Total</span><span style={C.sumPrice}>₦{calcTotal().toLocaleString()}</span></div>
            </div>
          )}

          <button type="submit" disabled={loading||!showSum} style={{...C.btnP,...(!showSum||loading?C.btnD:{})}}>
            {loading?"Processing...":showSum?`💳 Pay ₦${calcTotal().toLocaleString()} with Paystack →`:"Complete the form above"}
          </button>
          <div style={C.foot}>🔒 Secure payment powered by Paystack</div>
        </form>
      </div>
    </StudentLayout>
  );
}
