"use client";
export const dynamic = "force-dynamic";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────
interface Plan { id:string; planName:string; priceKobo:number; pricingType:string; includesPlagiarismCheck:boolean; [k:string]:any; }
interface OtherService { id:string; label:string; value:string; priceOND:number; priceBSC:number; pricePGD:number; pricePHD:number; plagiarismAddOnOND:number; plagiarismAddOnBSC:number; plagiarismAddOnPGD:number; plagiarismAddOnPHD:number; isActive:boolean; [k:string]:any; }

// ─── Styles ──────────────────────────────────────────────────
const C = {
  page:   { minHeight:"100vh", background:"#F0F9FF", fontFamily:"'DM Sans',sans-serif", padding:"1.5rem 1rem" },
  inner:  { maxWidth:"1100px", margin:"0 auto" },
  logo:   { textAlign:"center" as const, marginBottom:"1.5rem" },
  lname:  { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E" },
  lspan:  { color:"#38BDF8" },
  lsub:   { fontSize:".82rem", color:"#5B7EA6", marginTop:".2rem" },
  headline:{ textAlign:"center" as const, fontSize:"1.05rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1.5rem", lineHeight:1.4 },
  cols:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem", alignItems:"start" } as any,
  card:   { background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", boxShadow:"0 4px 24px rgba(14,165,233,.08)", padding:"1.5rem" },
  cardTitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1.25rem" },
  fg:     { marginBottom:".85rem" },
  lbl:    { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:    { width:"100%", padding:".65rem .9rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  inpErr: { width:"100%", padding:".65rem .9rem", borderRadius:"10px", border:"1.5px solid #FCA5A5", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  sel:    { width:"100%", padding:".65rem .9rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff", boxSizing:"border-box" as const },
  ta:     { width:"100%", padding:".65rem .9rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"80px", boxSizing:"border-box" as const },
  err:    { fontSize:".72rem", color:"#EF4444", fontWeight:600, marginTop:".3rem" },
  hint:   { fontSize:".7rem", color:"#5B7EA6", marginTop:".25rem" },
  divider:{ borderTop:"1px solid #E0F2FE", margin:"1rem 0" },
  secHdr: { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", marginBottom:".75rem" },
  // Buttons
  btnPrimary:{ width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnBank:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", background:"#fff", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginTop:".5rem" },
  btnDisabled:{ opacity:.5, cursor:"not-allowed" as const },
  // Plan cards
  planGrid:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".5rem", marginBottom:".75rem" },
  plan:    { border:"1.5px solid #E0F2FE", borderRadius:"10px", padding:".6rem .75rem", cursor:"pointer", background:"#fff" },
  planA:   { border:"1.5px solid #38BDF8", background:"#F0F9FF" },
  // Chapter pills
  chapGrid:{ display:"flex", flexWrap:"wrap" as const, gap:".4rem", marginBottom:".75rem" },
  chap:    { padding:".3rem .7rem", borderRadius:"999px", border:"1.5px solid #E0F2FE", fontSize:".78rem", cursor:"pointer", fontWeight:600, background:"#fff", color:"#0C1A2E" },
  chapA:   { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  // Summary box
  summary: { background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:"12px", padding:"1rem", marginBottom:"1rem" },
  sumRow:  { display:"flex", justifyContent:"space-between", fontSize:".8rem", marginBottom:".3rem" },
  sumTotal:{ display:"flex", justifyContent:"space-between", fontSize:"1rem", fontWeight:700, color:"#0C1A2E", paddingTop:".4rem", borderTop:"1px solid #BAE6FD", marginTop:".2rem" },
  // Upload
  upzone:  { border:"2px dashed #BAE6FD", borderRadius:"10px", padding:".85rem", textAlign:"center" as const, cursor:"pointer", fontSize:".78rem", color:"#5B7EA6" },
  // Bank modal
  modal:   { position:"fixed" as const, inset:0, background:"rgba(12,26,46,.6)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" },
  modalBox:{ background:"#fff", borderRadius:"16px", padding:"1.5rem", maxWidth:"420px", width:"100%" },
  // Sign in link
  foot:    { textAlign:"center" as const, fontSize:".82rem", color:"#5B7EA6", marginTop:"1.25rem" },
  flink:   { color:"#0369A1", fontWeight:700, textDecoration:"none" },
};

const DEG_OPTIONS = [
  { value:"OND_HND_NCE", label:"HND / OND / NCE" },
  { value:"BSC_BED_BA",  label:"BSc / BEd / BA"  },
  { value:"PGD_MSC_PHD", label:"PGD / MSc"        },
  { value:"PHD",         label:"PhD"              },
];

const CHAPTER_ROLES: Record<number,string> = { 1:"W",2:"W",3:"A",4:"A",5:"W" };
const ANALYST_CHAPTERS = [3,4];
const PROJECT_SERVICE = "HIRE_WRITER";

function toServiceType(s:string):string {
  const m:Record<string,string> = { seminar:"PROPOSAL_SEMINAR", proposal:"PROPOSAL_SEMINAR", journal:"JOURNAL_WRITING", journal_sourcing:"JOURNAL_SOURCING", topic:"TOPIC_SUGGESTION", assignment:"HIRE_WRITER" };
  return m[s] || "HIRE_WRITER";
}

function RegisterAndOrder() {
  const router = useRouter();

  // ── Account state ─────────────────────────────────────────
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [emailErr,  setEmailErr]  = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  // ── Hire form state ───────────────────────────────────────
  const [plans,       setPlans]       = useState<Plan[]>([]);
  const [services,    setServices]    = useState<OtherService[]>([]);
  const [exceptionCourses, setExceptionCourses] = useState<string[]>([]);
  const [geoInfo,     setGeoInfo]     = useState({ currency:"NGN", symbol:"₦", flw:"NGN", isNigeria:true });
  const [degreeGroup, setDegreeGroup] = useState("");
  const [service,     setService]     = useState("");
  const [planId,      setPlanId]      = useState("");
  const [selChapters, setSelChapters] = useState<number[]>([]);
  const [topic,       setTopic]       = useState("");
  const [department,  setDepartment]  = useState("");
  const [instructions,setInstructions]= useState("");
  const [guidelineUrls, setGuidelineUrls] = useState<{url:string,name:string}[]>([]);
  const [uploadingGuide, setUploadingGuide] = useState(false);
  const [quantity,    setQuantity]    = useState(1);
  const [areaOfInterest, setAreaOfInterest] = useState("");
  const [wantsPlagCheck, setWantsPlagCheck] = useState(false);

  // ── Payment state ─────────────────────────────────────────
  const [loading,     setLoading]     = useState(false);
  const [showBankModal,setShowBankModal] = useState(false);
  const [bankDone,    setBankDone]    = useState<any>(null);
  const [bankPending, setBankPending] = useState(false);

  // ── Load data ─────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/plans").then(r=>r.json()),
      fetch("/api/other-services/public").then(r=>r.json()),
      fetch("/api/detect-country").then(r=>r.json()),
      fetch("/api/exception-courses").then(r=>r.json()),
    ]).then(([p,s,g,e]) => {
      if (p.success) setPlans(p.data);
      if (s.success) setServices(s.data);
      if (g) setGeoInfo({ currency:g.currency||"NGN", symbol:g.symbol||"₦", flw:g.flw||"NGN", isNigeria:g.isNigeria!==false });
      if (e.success) setExceptionCourses(e.data.map((c:any)=>c.courseName?.toLowerCase()));
    });
  }, []);

  // ── Derived ───────────────────────────────────────────────
  const isProject       = service === PROJECT_SERVICE || service === "";
  const SERVICES        = services.filter(s => s.isActive);
  const isExceptionDept = isProject && department.trim().length >= 3 && exceptionCourses.some(exc => department.toLowerCase().trim().includes(exc));
  const selectedPlan    = plans.find(p => p.id === planId);
  const visiblePlans    = isExceptionDept ? plans.filter(p => p.planName==="PROFESSIONAL"||p.planName==="PHD_PROFESSIONAL") : plans;
  const isPerChapter    = selectedPlan?.pricingType === "PER_CHAPTER";
  const isQuickService  = service === "topic" || service === "journal_sourcing";
  const isBasicPlan     = selectedPlan?.planName === "BASIC";

  useEffect(() => {
    if (!planId || !selectedPlan) return;
    if (isExceptionDept && selectedPlan.planName !== "PROFESSIONAL" && selectedPlan.planName !== "PHD_PROFESSIONAL") {
      setPlanId(""); setSelChapters([]);
    }
  }, [isExceptionDept]);

  // ── Pricing ───────────────────────────────────────────────
  function getPlagAddOn():number {
    if (isProject || !degreeGroup) return 0;
    const svc = SERVICES.find(s=>s.value===service) as any;
    if (!svc) return 0;
    const degKey:Record<string,string>={OND_HND_NCE:"OND",BSC_BED_BA:"BSC",PGD_MSC_PHD:"PGD",PHD:"PHD"};
    return ((svc[`plagiarismAddOn${degKey[degreeGroup]||"BSC"}`]||0)/100);
  }

  function calcTotal():number {
    if (!degreeGroup) return 0;
    if (!isProject) {
      const svc = SERVICES.find(s=>s.value===service) as any;
      if (!svc) return 0;
      const degKey:Record<string,string>={OND_HND_NCE:"OND",BSC_BED_BA:"BSC",PGD_MSC_PHD:"PGD",PHD:"PHD"};
      let unit = 0;
      if (!geoInfo.isNigeria) {
        const f=`price${geoInfo.currency}${degKey[degreeGroup]||"BSC"}`;
        unit=(svc[f]||0)/100;
      }
      if (!unit) {
        const pm:Record<string,number>={OND_HND_NCE:svc.priceOND||0,BSC_BED_BA:svc.priceBSC||0,PGD_MSC_PHD:svc.pricePGD||0,PHD:svc.pricePHD||svc.pricePGD||0};
        unit=(pm[degreeGroup]||0)/100;
      }
      const qty=isQuickService?quantity:1;
      const addOn=wantsPlagCheck&&geoInfo.isNigeria?getPlagAddOn():0;
      return unit*qty+addOn;
    }
    if (!selectedPlan) return 0;
    const intlField=`price${geoInfo.currency}` as keyof Plan;
    const unit=(!geoInfo.isNigeria&&selectedPlan[intlField])?(selectedPlan[intlField] as number)/100:selectedPlan.priceKobo/100;
    return isPerChapter?unit*selChapters.length:unit;
  }

  const total = calcTotal();
  const showSummary = degreeGroup && (isProject?(planId&&(!isPerChapter||selChapters.length>0)):service) && topic.trim();

  // ── Email duplicate check ─────────────────────────────────
  const emailCheckTimer = useRef<any>(null);
  function handleEmailChange(val:string) {
    setEmail(val); setEmailErr("");
    clearTimeout(emailCheckTimer.current);
    if (!val.includes("@")) return;
    emailCheckTimer.current = setTimeout(async () => {
      setCheckingEmail(true);
      const res = await fetch(`/api/auth/register-and-order?email=${encodeURIComponent(val)}`);
      const data = await res.json();
      setCheckingEmail(false);
      if (data.exists) setEmailErr("Email already exists. Please sign in instead.");
    }, 600);
  }

  // ── Guideline upload ──────────────────────────────────────
  async function handleGuidelineUpload(file:File) {
    if(file.size>20*1024*1024){toast.error("Max 20MB per file");return;}
    setUploadingGuide(true);
    try {
      const fd=new FormData(); fd.append("file",file); fd.append("folder","orders/guidelines");
      const res=await fetch("/api/upload",{method:"POST",body:fd});
      const data=await res.json();
      if(res.ok) setGuidelineUrls(prev=>[...prev,{url:data.url,name:file.name}]);
      else toast.error(data.error||"Upload failed. Please try again.");
    } catch { toast.error("Upload failed — please check your connection and try again."); }
    finally { setUploadingGuide(false); }
  }

  // ── Validation ────────────────────────────────────────────
  function validateAll():string {
    if (!name.trim())    return "Please enter your full name.";
    if (!phone.trim())   return "Please enter your WhatsApp number.";
    if (!email.trim())   return "Please enter your email address.";
    if (emailErr)        return emailErr;
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    if (!degreeGroup)    return "Please select your degree level.";
    if (!topic.trim())   return "Please enter your project topic.";
    if (isProject && !planId) return "Please select a plan.";
    if (isProject && isPerChapter && selChapters.length === 0) return "Please select at least one chapter.";
    if (!isProject && !service) return "Please select a service.";
    return "";
  }

  // ── Build payload ─────────────────────────────────────────
  function buildPayload(pm:string) {
    return {
      name: name.trim(), email: email.trim(), phone: phone.trim(), password,
      planId: isProject ? planId : "flat",
      topic: service==="topic" ? `Topic Coining — ${department.trim()}` : topic.trim(),
      department: department.trim(),
      degreeGroup,
      specialInstructions: service==="topic"
        ? `Course: ${department.trim()}. Area of Interest: ${areaOfInterest.trim()}.${instructions.trim()?" "+instructions.trim():""}`
        : instructions.trim() || undefined,
      quantity: isQuickService ? quantity : undefined,
      requiresPlagiarismCheck: (!isProject&&wantsPlagCheck)||undefined,
      guidelineFileUrl: guidelineUrls.length>0 ? guidelineUrls.map(f=>f.url).join(",") : undefined,
      chaptersRequested: isProject&&isPerChapter ? selChapters : undefined,
      serviceType: toServiceType(service),
      paymentMethod: pm,
      currency: geoInfo.flw,
    };
  }

  // ── Submit handlers ───────────────────────────────────────
  async function handlePaystack() {
    const err = validateAll(); if(err){toast.error(err);return;}
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register-and-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(buildPayload("PAYSTACK"))});
      const data = await res.json();
      if(!res.ok){toast.error(data.error||"Something went wrong.");return;}
      window.location.href = data.paymentUrl;
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleFlutterwave() {
    const err = validateAll(); if(err){toast.error(err);return;}
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/register-and-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(buildPayload("FLUTTERWAVE"))});
      const data = await res.json();
      if(!res.ok){toast.error(data.error||"Something went wrong.");return;}
      window.location.href = data.paymentUrl;
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleBankTransfer() {
    const err = validateAll(); if(err){toast.error(err);return;}
    setBankPending(true);
    try {
      const res  = await fetch("/api/auth/register-and-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(buildPayload("BANK_TRANSFER"))});
      const data = await res.json();
      if(!res.ok){toast.error(data.error||"Something went wrong.");setBankPending(false);setShowBankModal(false);return;}
      setBankDone(data);
    } catch { toast.error("Something went wrong. Please try again.");setBankPending(false);setShowBankModal(false); }
  }

  return (
    <div style={C.page}>
      <div style={C.inner}>
        {/* Logo */}
        <div style={C.logo}>
          <div style={C.lname}>iProject<span style={C.lspan}>Master</span></div>
          <div style={{ fontSize:".82rem", color:"#5B7EA6", marginTop:".25rem" }}>Hire an expert writer and get started today</div>
        </div>

        <div style={C.headline}>Fill in your project details and create your account — all in one step.</div>

        <div style={{...C.cols, '@media(maxWidth:768px)':{gridTemplateColumns:"1fr"}}}>

          {/* ── LEFT: Hire Form ── */}
          <div style={C.card}>
            <div style={C.cardTitle}>📋 Your Order</div>

            {/* Degree */}
            <div style={C.fg}>
              <label style={C.lbl}>Degree Level <span style={{color:"#EF4444"}}>*</span></label>
              <select style={C.sel} value={degreeGroup} onChange={e=>{setDegreeGroup(e.target.value);setPlanId("");setSelChapters([]);}}>
                <option value="">Select your level...</option>
                {DEG_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Service */}
            <div style={C.fg}>
              <label style={C.lbl}>Service</label>
              <select style={C.sel} value={service} onChange={e=>{setService(e.target.value);setPlanId("");setSelChapters([]);setQuantity(1);setAreaOfInterest("");}}>
                <option value="">Hire a Writer (Project)</option>
                {SERVICES.map(s=><option key={s.id} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Topic */}
            {service!=="topic" && (
              <div style={C.fg}>
                <label style={C.lbl}>Project Topic <span style={{color:"#EF4444"}}>*</span></label>
                <textarea style={C.ta} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Enter your full project topic..." />
              </div>
            )}

            {/* Department */}
            {service!=="topic" && service!=="journal_sourcing" && (
              <div style={C.fg}>
                <label style={C.lbl}>Department / Course</label>
                <input style={C.inp} value={department} onChange={e=>setDepartment(e.target.value)} placeholder="e.g. Business Administration" />
              </div>
            )}

            {/* Topic Coining */}
            {service==="topic" && (
              <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:"10px",padding:".85rem",marginBottom:".85rem"}}>
                <div style={{...C.secHdr,marginBottom:".6rem"}}>Topic Coining Details <span style={{fontSize:".6rem",fontWeight:700,color:"#065F46",background:"#D1FAE5",padding:"1px 7px",borderRadius:"999px",marginLeft:".5rem"}}>⚡ 24hr</span></div>
                <div style={C.fg}><label style={C.lbl}>Course / Department</label><input style={C.inp} value={department} onChange={e=>setDepartment(e.target.value)} placeholder="e.g. Computer Science" /></div>
                <div style={C.fg}><label style={C.lbl}>Area of Interest</label><input style={C.inp} value={areaOfInterest} onChange={e=>setAreaOfInterest(e.target.value)} placeholder="e.g. Artificial Intelligence" /></div>
                <div style={C.fg}><label style={C.lbl}>Quantity</label>
                  <div style={{display:"flex",gap:".5rem",alignItems:"center"}}>
                    <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} style={{padding:".35rem .75rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",background:"#fff",cursor:"pointer",fontWeight:700}}>−</button>
                    <span style={{fontWeight:700,minWidth:"2rem",textAlign:"center"}}>{quantity}</span>
                    <button onClick={()=>setQuantity(q=>Math.min(20,q+1))} style={{padding:".35rem .75rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",background:"#fff",cursor:"pointer",fontWeight:700}}>+</button>
                  </div>
                </div>
              </div>
            )}

            {/* Journal Sourcing */}
            {service==="journal_sourcing" && (
              <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:"10px",padding:".85rem",marginBottom:".85rem"}}>
                <div style={{...C.secHdr,marginBottom:".6rem"}}>Journal Sourcing Details <span style={{fontSize:".6rem",fontWeight:700,color:"#065F46",background:"#D1FAE5",padding:"1px 7px",borderRadius:"999px",marginLeft:".5rem"}}>⚡ 24hr</span></div>
                <div style={C.fg}><label style={C.lbl}>Topic</label><textarea style={C.ta} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="What journals are you looking for?" /></div>
                <div style={C.fg}><label style={C.lbl}>Quantity</label>
                  <div style={{display:"flex",gap:".5rem",alignItems:"center"}}>
                    <button onClick={()=>setQuantity(q=>Math.max(1,q-1))} style={{padding:".35rem .75rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",background:"#fff",cursor:"pointer",fontWeight:700}}>−</button>
                    <span style={{fontWeight:700,minWidth:"2rem",textAlign:"center"}}>{quantity}</span>
                    <button onClick={()=>setQuantity(q=>Math.min(20,q+1))} style={{padding:".35rem .75rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",background:"#fff",cursor:"pointer",fontWeight:700}}>+</button>
                  </div>
                </div>
              </div>
            )}

            {/* Plans (project only) */}
            {isProject && degreeGroup && (
              <div style={C.fg}>
                <label style={C.lbl}>Select Plan</label>
                <div style={C.planGrid}>
                  {visiblePlans.map(p=>(
                    <div key={p.id} style={{...C.plan,...(planId===p.id?C.planA:{})}} onClick={()=>{setPlanId(p.id);setSelChapters([]);}}>
                      <div style={{fontSize:".78rem",fontWeight:700}}>{p.planName}</div>
                      <div style={{fontSize:".72rem",color:"#5B7EA6"}}>₦{(p.priceKobo/100).toLocaleString()}{p.pricingType==="PER_CHAPTER"?" / ch":""}</div>
                      {p.includesPlagiarismCheck&&<div style={{fontSize:".6rem",color:"#065F46",fontWeight:700}}>✓ QC included</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chapters (per-chapter plan) */}
            {isProject && isPerChapter && planId && (
              <div style={C.fg}>
                <label style={C.lbl}>Select Chapters</label>
                <div style={C.chapGrid}>
                  {[1,2,3,4,5].map(n=>(
                    <div key={n} style={{...C.chap,...(selChapters.includes(n)?C.chapA:{})}}
                      onClick={()=>setSelChapters(prev=>prev.includes(n)?prev.filter(c=>c!==n):[...prev,n].sort())}>
                      Ch {n} <span style={{fontSize:".65rem",opacity:.7}}>({CHAPTER_ROLES[n]==="A"?"Analyst":"Writer"})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plag check (other services) */}
            {!isProject && service && service!=="topic" && service!=="journal_sourcing" && geoInfo.isNigeria && getPlagAddOn()>0 && (
              <label style={{display:"flex",gap:".75rem",alignItems:"flex-start",padding:".75rem",background:"#F5F3FF",borderRadius:"10px",border:"1px solid #DDD6FE",cursor:"pointer",marginBottom:".85rem"}}>
                <input type="checkbox" checked={wantsPlagCheck} onChange={e=>setWantsPlagCheck(e.target.checked)} style={{marginTop:"2px"}} />
                <div>
                  <div style={{fontSize:".8rem",fontWeight:700,color:"#5B21B6"}}>🔍 Add Plagiarism & AI Detection Check</div>
                  <div style={{fontSize:".72rem",color:"#6D28D9"}}>+{geoInfo.symbol}{getPlagAddOn().toLocaleString()}</div>
                </div>
              </label>
            )}

            {/* Special instructions */}
            {service!=="topic" && service!=="journal_sourcing" && !isBasicPlan && (
              <div style={C.fg}>
                <label style={C.lbl}>Special Instructions <span style={{fontWeight:400,textTransform:"none",color:"#5B7EA6"}}>(optional)</span></label>
                <textarea style={C.ta} value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Any specific instructions for the writer..." />
              </div>
            )}

            {/* Guideline upload */}
            {service!=="topic" && service!=="journal_sourcing" && !isBasicPlan && (
              <div style={C.fg}>
                <label style={C.lbl}>Upload Guideline / School Format <span style={{fontWeight:400,textTransform:"none",color:"#5B7EA6"}}>(optional)</span></label>
                {guidelineUrls.map((f,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:"8px",padding:".4rem .75rem",marginBottom:".4rem",fontSize:".75rem"}}>
                    <span style={{color:"#065F46",fontWeight:600}}>✅ {f.name}</span>
                    <button onClick={()=>setGuidelineUrls(prev=>prev.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444"}}>✕</button>
                  </div>
                ))}
                {guidelineUrls.length < 5 && (
                  <div style={C.upzone} onClick={()=>{
                    const inp=document.createElement("input"); inp.type="file";
                    inp.accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.mp3,.m4a,.wav,.zip";
                    inp.onchange=(e)=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleGuidelineUpload(f);}; inp.click();
                  }}>
                    {uploadingGuide ? "Uploading..." : `📎 ${guidelineUrls.length>0?"Add another file":"Click to upload"} · PDF, Word, images, audio · Max 20MB`}
                  </div>
                )}
              </div>
            )}

            {/* Order summary */}
            {showSummary && total > 0 && (
              <div style={C.summary}>
                <div style={{...C.secHdr,marginBottom:".5rem"}}>Order Summary</div>
                {isProject && isPerChapter && selChapters.length>0 && (
                  <div style={C.sumRow}><span style={{color:"#5B7EA6"}}>Chapters</span><span>{selChapters.map(n=>`Ch ${n}`).join(", ")}</span></div>
                )}
                {!isProject && wantsPlagCheck && getPlagAddOn()>0 && (
                  <div style={C.sumRow}><span style={{color:"#5B7EA6"}}>+ Plag/AI Check</span><span>{geoInfo.symbol}{getPlagAddOn().toLocaleString()}</span></div>
                )}
                <div style={C.sumTotal}><span>Total</span><span>{geoInfo.symbol}{total.toLocaleString()}</span></div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Account + Payment ── */}
          <div>
            <div style={C.card}>
              <div style={C.cardTitle}>👤 Create Your Account</div>

              <div style={C.fg}>
                <label style={C.lbl}>Full Name <span style={{color:"#EF4444"}}>*</span></label>
                <input style={C.inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
              </div>

              <div style={C.fg}>
                <label style={C.lbl}>WhatsApp Number <span style={{color:"#EF4444"}}>*</span></label>
                <input style={C.inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08012345678" />
                <div style={C.hint}>We'll send order updates here</div>
              </div>

              <div style={C.fg}>
                <label style={C.lbl}>Email Address <span style={{color:"#EF4444"}}>*</span></label>
                <input
                  style={emailErr ? C.inpErr : C.inp}
                  type="email" value={email}
                  onChange={e=>handleEmailChange(e.target.value)}
                  placeholder="you@email.com" />
                {checkingEmail && <div style={{...C.hint,color:"#38BDF8"}}>Checking...</div>}
                {emailErr && (
                  <div style={C.err}>
                    {emailErr}{" "}
                    <a href="/login" style={{color:"#0369A1",fontWeight:700}}>Sign in →</a>
                  </div>
                )}
              </div>

              <div style={C.fg}>
                <label style={C.lbl}>Password <span style={{color:"#EF4444"}}>*</span></label>
                <input style={C.inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 8 characters" />
              </div>

              <div style={C.fg}>
                <label style={C.lbl}>Confirm Password <span style={{color:"#EF4444"}}>*</span></label>
                <input style={C.inp} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter password" />
                {confirm && password !== confirm && <div style={C.err}>Passwords do not match.</div>}
              </div>

              <div style={C.divider} />

              {/* Payment buttons */}
              {geoInfo.isNigeria ? (
                <>
                  <button onClick={handlePaystack} disabled={loading||!!emailErr||checkingEmail}
                    style={{...C.btnPrimary,...(loading||!!emailErr?C.btnDisabled:{})}}>
                    {loading ? "Processing..." : `💳 Pay ₦${total.toLocaleString()} with Paystack →`}
                  </button>
                  <button onClick={()=>setShowBankModal(true)} disabled={!!emailErr||checkingEmail}
                    style={{...C.btnBank,...(emailErr?C.btnDisabled:{})}}>
                    🏦 Pay via Bank Transfer
                  </button>
                </>
              ) : (
                <button onClick={handleFlutterwave} disabled={loading||!!emailErr||checkingEmail}
                  style={{...C.btnPrimary,...(loading||!!emailErr?C.btnDisabled:{})}}>
                  {loading ? "Processing..." : `💳 Pay ${geoInfo.symbol}${total.toLocaleString()} →`}
                </button>
              )}

              <div style={C.foot}>
                Already have an account?{" "}
                <a href="/login" style={C.flink}>Sign in →</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bank Transfer Modal ── */}
      {showBankModal && !bankDone && (
        <div style={C.modal}>
          <div style={C.modalBox}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:800,marginBottom:".75rem"}}>🏦 Bank Transfer</div>
            <p style={{fontSize:".83rem",color:"#5B7EA6",marginBottom:"1rem",lineHeight:1.6}}>
              Click below to register your account and get your unique payment reference. Transfer the exact amount to our account and your order will be activated once confirmed.
            </p>
            <div style={{display:"flex",gap:".5rem"}}>
              <button disabled={bankPending} onClick={handleBankTransfer}
                style={{...C.btnPrimary,flex:1,...(bankPending?C.btnDisabled:{})}}>
                {bankPending ? "Processing..." : "Register & Get Reference →"}
              </button>
              <button onClick={()=>setShowBankModal(false)}
                style={{padding:".85rem 1rem",borderRadius:"12px",border:"1.5px solid #BAE6FD",background:"#fff",cursor:"pointer",fontWeight:700,color:"#5B7EA6"}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bank Transfer Success ── */}
      {bankDone && (
        <div style={C.modal}>
          <div style={C.modalBox}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:800,marginBottom:".75rem",color:"#065F46"}}>✅ Account Created!</div>
            <p style={{fontSize:".83rem",color:"#5B7EA6",marginBottom:".75rem",lineHeight:1.6}}>Transfer <strong>₦{bankDone.amountNaira?.toLocaleString()}</strong> to:</p>
            {bankDone.bankAccount && (
              <div style={{background:"#F0F9FF",borderRadius:"10px",padding:"1rem",marginBottom:"1rem",fontSize:".83rem"}}>
                <div><strong>Bank:</strong> {bankDone.bankAccount.bankName}</div>
                <div><strong>Account:</strong> {bankDone.bankAccount.accountNumber}</div>
                <div><strong>Name:</strong> {bankDone.bankAccount.accountName}</div>
                <div style={{marginTop:".5rem",fontWeight:700,color:"#0369A1"}}><strong>Reference:</strong> {bankDone.reference}</div>
              </div>
            )}
            <p style={{fontSize:".78rem",color:"#5B7EA6",marginBottom:"1rem"}}>Use the reference as your payment description. Your order will be activated once payment is confirmed.</p>
            <a href="/login" style={{...C.btnPrimary,display:"block",textAlign:"center" as const,textDecoration:"none",padding:".85rem"}}>
              Go to Login →
            </a>
          </div>
        </div>
      )}

      <WhatsAppWidget message="Hi Lina, I need help placing an order on iProjectMaster." />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#5B7EA6"}}>Loading...</div>}>
      <RegisterAndOrder />
    </Suspense>
  );
}
