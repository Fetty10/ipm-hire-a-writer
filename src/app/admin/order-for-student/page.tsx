"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";

const C = {
  page:  { maxWidth:"620px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", padding:"1.75rem", marginBottom:"1.25rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".7rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  sel:   { width:"100%", padding:".7rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, background:"#fff" },
  ta:    { width:"100%", padding:".7rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, resize:"vertical" as const, minHeight:"80px" },
  btn:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { opacity:.6, cursor:"not-allowed" as const },
  info:  { background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:"12px", padding:"1rem 1.25rem", fontSize:".82rem", color:"#0369A1", marginBottom:"1rem" },
  warn:  { background:"#FFFBEB", border:"1.5px solid #FDE68A", borderRadius:"12px", padding:"1rem 1.25rem", fontSize:".82rem", color:"#92400E", marginBottom:"1rem" },
  chapGrid: { display:"flex", flexWrap:"wrap" as const, gap:".5rem", marginTop:".4rem" },
  chap:  { padding:".35rem .85rem", borderRadius:"999px", border:"1.5px solid #E0F2FE", fontSize:".78rem", cursor:"pointer", fontWeight:600, background:"#fff", color:"#0C1A2E" },
  chapA: { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  found: { background:"#F0FDF4", border:"1.5px solid #BBF7D0", borderRadius:"12px", padding:".85rem 1.25rem", marginBottom:"1rem" },
};

const DEG_OPTIONS = [
  { value:"OND_HND_NCE", label:"HND / OND / NCE" },
  { value:"BSC_BED_BA",  label:"BSc / BEd / BA"  },
  { value:"PGD_MSC_PHD", label:"PGD / MSc / MBA"  },
  { value:"PHD",         label:"PhD"              },
];

export default function AdminOrderForStudent() {
  const [email,      setEmail]      = useState("");
  const [student,    setStudent]    = useState<any>(null);
  const [checking,   setChecking]   = useState(false);
  const [plans,      setPlans]      = useState<any[]>([]);
  const [otherSvcs,  setOtherSvcs]  = useState<any[]>([]);
  const [bankAcct,   setBankAcct]   = useState<any>(null);
  const [loading,    setLoading]    = useState(false);

  const [form, setForm] = useState({
    degreeGroup: "", serviceType: "project", planId: "",
    topic: "", department: "", specialInstructions: "",
    selectedChapters: [] as number[],
    paymentMethod: "BANK_TRANSFER",
    guidelineFileUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState<any>(null);

  function upd(k: string, v: any) { setForm(f => ({...f, [k]: v})); }

  async function checkStudent() {
    if (!email.trim()) { toast.error("Enter a student email."); return; }
    setChecking(true); setStudent(null); setResult(null);
    const res  = await fetch(`/api/admin/find-student?email=${encodeURIComponent(email.trim())}`);
    const data = await res.json();
    if (data.success) setStudent(data.data);
    else toast.error(data.error || "Student not found.");
    setChecking(false);
  }

  useEffect(() => {
    if (!form.degreeGroup || form.serviceType !== "project") return;
    fetch(`/api/plans?degreeGroup=${form.degreeGroup}`)
      .then(r=>r.json()).then(d=>{ if(d.success) setPlans(d.data); });
  }, [form.degreeGroup, form.serviceType]);

  useEffect(() => {
    fetch("/api/other-services/public").then(r=>r.json()).then(d=>{ if(d.success) setOtherSvcs(d.data); });
    fetch("/api/orders/bank-transfer").then(r=>r.json()).then(d=>{ if(d.success) setBankAcct(d.data); });
  }, []);

  const isProject    = form.serviceType === "project";
  const selectedPlan = plans.find(p => p.id === form.planId);
  const isPerChapter = selectedPlan?.pricingType === "PER_CHAPTER";

  const SERVICE_TYPE_MAP: Record<string,string> = {
    project:"HIRE_WRITER", seminar:"PROPOSAL_SEMINAR", proposal:"PROPOSAL_SEMINAR",
    journal:"JOURNAL_WRITING", journal_sourcing:"JOURNAL_SOURCING",
    topic:"TOPIC_SUGGESTION", assignment:"ASSIGNMENT", power_point:"POWERPOINT",
  };

  async function handleUpload() {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.zip,.mp3,.m4a,.wav";
    inp.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 20*1024*1024) { toast.error("Max 20MB"); return; }
      setUploading(true);
      const fd = new FormData(); fd.append("file", file); fd.append("folder", "orders/guidelines");
      const res  = await fetch("/api/admin/upload", { method:"POST", body:fd });
      const data = await res.json();
      if (res.ok) {
        const existing = form.guidelineFileUrl ? form.guidelineFileUrl.split(",").filter(Boolean) : [];
        upd("guidelineFileUrl", [...existing, data.url].join(","));
        toast.success("File uploaded.");
      } else toast.error(data.error || "Upload failed.");
      setUploading(false);
    };
    inp.click();
  }

  async function handleSubmit() {
    if (!student) { toast.error("Find a student first."); return; }
    if (!form.topic.trim()) { toast.error("Topic is required."); return; }
    if (!form.degreeGroup) { toast.error("Select degree level."); return; }
    if (isProject && !form.planId) { toast.error("Select a plan."); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/admin/order-for-student", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          studentId:           student.id,
          topic:               form.topic.trim(),
          department:          form.department.trim(),
          degreeGroup:         form.degreeGroup,
          planId:              isProject ? form.planId : undefined,
          serviceType:         SERVICE_TYPE_MAP[form.serviceType] || "HIRE_WRITER",
          selectedChapters:    isPerChapter && form.selectedChapters.length ? form.selectedChapters.sort().join(",") : undefined,
          specialInstructions: form.specialInstructions.trim() || undefined,
          guidelineFileUrl:    form.guidelineFileUrl || undefined,
          paymentMethod:       form.paymentMethod,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success("Order created successfully!");
        setForm({ degreeGroup:"", serviceType:"project", planId:"", topic:"", department:"", specialInstructions:"", selectedChapters:[], paymentMethod:"BANK_TRANSFER", guidelineFileUrl:"" });
      } else toast.error(data.error || "Something went wrong.");
    } catch { toast.error("Network error."); }
    finally { setLoading(false); }
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Order on Behalf of Student</h1>
        <p style={C.sub}>Place a hire-a-writer order for an existing student using their email — no login details needed.</p>

        {/* Step 1 — Find Student */}
        <div style={C.card}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:"#0C1A2E",marginBottom:"1rem"}}>1. Find Student</div>
          <div style={{display:"flex",gap:".5rem"}}>
            <input style={{...C.inp,flex:1}} type="email" value={email}
              onChange={e=>setEmail(e.target.value)} placeholder="student@email.com"
              onKeyDown={e=>e.key==="Enter"&&checkStudent()} />
            <button onClick={checkStudent} disabled={checking}
              style={{padding:".7rem 1.25rem",borderRadius:"12px",border:"none",background:"#0C1A2E",color:"#38BDF8",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap" as const,fontSize:".85rem"}}>
              {checking ? "..." : "Find →"}
            </button>
          </div>
          {student && (
            <div style={{...C.found, marginTop:"1rem", marginBottom:0}}>
              <div style={{fontWeight:700,color:"#065F46"}}>✅ Found: {student.name}</div>
              <div style={{fontSize:".78rem",color:"#5B7EA6",marginTop:"2px"}}>{student.email} · {student.phone}</div>
            </div>
          )}
        </div>

        {/* Step 2 — Order Details */}
        {student && (
          <div style={C.card}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:"#0C1A2E",marginBottom:"1rem"}}>2. Order Details</div>

            <div style={C.fg}>
              <label style={C.lbl}>Service Type</label>
              <select style={C.sel} value={form.serviceType} onChange={e=>{ upd("serviceType",e.target.value); upd("planId",""); upd("selectedChapters",[]); }}>
                <option value="project">Full Project (Hire a Writer)</option>
                {otherSvcs.map((s:any) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div style={C.fg}>
              <label style={C.lbl}>Degree Level</label>
              <select style={C.sel} value={form.degreeGroup} onChange={e=>{ upd("degreeGroup",e.target.value); upd("planId",""); upd("selectedChapters",[]); }}>
                <option value="">Select degree...</option>
                {DEG_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {isProject && plans.length > 0 && (
              <div style={C.fg}>
                <label style={C.lbl}>Plan</label>
                <select style={C.sel} value={form.planId} onChange={e=>{ upd("planId",e.target.value); upd("selectedChapters",[]); }}>
                  <option value="">Select plan...</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.planName} — ₦{(p.priceKobo/100).toLocaleString()}{p.pricingType==="PER_CHAPTER"?"/chapter":" flat"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isProject && isPerChapter && form.planId && (
              <div style={C.fg}>
                <label style={C.lbl}>Chapters</label>
                <div style={C.chapGrid}>
                  {[1,2,3,4,5,6].map(n => (
                    <button key={n} type="button"
                      style={{...C.chap,...(form.selectedChapters.includes(n)?C.chapA:{})}}
                      onClick={()=>upd("selectedChapters", form.selectedChapters.includes(n)
                        ? form.selectedChapters.filter(c=>c!==n)
                        : [...form.selectedChapters,n].sort())}>
                      Ch {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={C.fg}>
              <label style={C.lbl}>Project Topic</label>
              <textarea style={C.ta} value={form.topic} onChange={e=>upd("topic",e.target.value)} placeholder="Full topic..." />
            </div>

            <div style={C.fg}>
              <label style={C.lbl}>Department / Course</label>
              <input style={C.inp} value={form.department} onChange={e=>upd("department",e.target.value)} placeholder="e.g. Business Administration" />
            </div>

            <div style={C.fg}>
              <label style={C.lbl}>Special Instructions <span style={{fontWeight:400,textTransform:"none" as const,color:"#94A3B8"}}>(optional)</span></label>
              <textarea style={C.ta} value={form.specialInstructions} onChange={e=>upd("specialInstructions",e.target.value)} placeholder="Any specific instructions..." />
            </div>

            {/* Guideline files */}
            <div style={C.fg}>
              <label style={C.lbl}>Guideline Files <span style={{fontWeight:400,textTransform:"none" as const,color:"#94A3B8"}}>(optional)</span></label>
              {form.guidelineFileUrl && form.guidelineFileUrl.split(",").filter(Boolean).map((url:string,i:number,arr:string[])=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:"8px",padding:".4rem .75rem",marginBottom:".4rem",fontSize:".78rem"}}>
                  <span style={{color:"#065F46",fontWeight:600}}>📎 File {arr.length>1?i+1:""}</span>
                  <button onClick={()=>{ const updated=arr.filter((_:string,j:number)=>j!==i).join(","); upd("guidelineFileUrl",updated); }}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444"}}>✕</button>
                </div>
              ))}
              {(!form.guidelineFileUrl || form.guidelineFileUrl.split(",").filter(Boolean).length < 5) && (
                <div onClick={handleUpload}
                  style={{border:"2px dashed #BAE6FD",borderRadius:"10px",padding:".75rem",textAlign:"center" as const,cursor:uploading?"not-allowed":"pointer",background:"#F8FCFF",fontSize:".78rem",color:"#5B7EA6"}}>
                  {uploading ? "⏳ Uploading..." : "📎 Click to upload guideline · PDF, Word, images, audio, ZIP · Max 20MB"}
                </div>
              )}
            </div>

            <div style={C.fg}>
              <label style={C.lbl}>Payment Method</label>
              <select style={C.sel} value={form.paymentMethod} onChange={e=>upd("paymentMethod",e.target.value)}>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="PAYSTACK">Paystack (generate payment link)</option>
                <option value="FLUTTERWAVE">Flutterwave (international)</option>
              </select>
            </div>

            <button style={{...C.btn,...(loading?C.btnD:{})}} disabled={loading} onClick={handleSubmit}>
              {loading ? "Creating Order..." : "➕ Create Order for Student"}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={C.found}>
            <div style={{fontWeight:700,color:"#065F46",marginBottom:".5rem"}}>✅ Order Created Successfully!</div>
            {result.paymentMethod === "BANK_TRANSFER" && (
              <>
                <div style={{fontSize:".82rem",color:"#0C1A2E",marginBottom:".25rem"}}>
                  <strong>Reference:</strong> {result.reference}
                </div>
                <div style={{fontSize:".82rem",color:"#0C1A2E",marginBottom:".25rem"}}>
                  <strong>Amount:</strong> ₦{result.amountNaira?.toLocaleString()}
                </div>
                <div style={{fontSize:".78rem",color:"#5B7EA6"}}>
                  Bank: {bankAcct?.bankName} · {bankAcct?.accountNumber} · {bankAcct?.accountName}
                </div>
              </>
            )}
            {(result.paymentMethod === "PAYSTACK" || result.paymentMethod === "FLUTTERWAVE") && (
              <a href={result.paymentUrl} target="_blank" rel="noreferrer"
                style={{display:"inline-block",marginTop:".5rem",padding:".5rem 1rem",borderRadius:"8px",background:"#0C1A2E",color:"#38BDF8",fontWeight:700,fontSize:".82rem",textDecoration:"none"}}>
                Open Payment Link →
              </a>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
