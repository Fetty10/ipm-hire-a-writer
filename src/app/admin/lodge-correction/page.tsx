"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";

const DEG_OPTIONS = [
  { value:"OND_HND_NCE", label:"HND / OND / NCE"  },
  { value:"BSC_BED_BA",  label:"BSc / BEd / BA"   },
  { value:"PGD_MSC_PHD", label:"PGD / MSc"        },
  { value:"PHD",         label:"PhD"               },
];

const C = {
  page: { maxWidth:"620px", margin:"0 auto" },
  h1:   { fontFamily:"'Syne',sans-serif", fontSize:"1.5rem", fontWeight:800, color:"#0C1A2E", marginBottom:".25rem" },
  sub:  { fontSize:".82rem", color:"#5B7EA6", marginBottom:"1.75rem", lineHeight:1.6 },
  card: { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.5rem" },
  secHdr: { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", marginBottom:".75rem", marginTop:"1.25rem", borderTop:"1px solid #F0F9FF", paddingTop:"1.25rem" },
  fg:   { marginBottom:"1rem" },
  lbl:  { display:"block", fontSize:".72rem", fontWeight:700, color:"#0C1A2E", marginBottom:".35rem" },
  inp:  { width:"100%", padding:".6rem .9rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  sel:  { width:"100%", padding:".6rem .9rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff", boxSizing:"border-box" as const },
  ta:   { width:"100%", padding:".6rem .9rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"100px", boxSizing:"border-box" as const },
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem" },
  hint: { fontSize:".7rem", color:"#5B7EA6", marginTop:".3rem" },
  btn:  { width:"100%", padding:".85rem", borderRadius:"12px", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, border:"none", cursor:"pointer", marginTop:"1.25rem", fontFamily:"'DM Sans',sans-serif" },
  btnD: { opacity:.6, cursor:"not-allowed" as const },
  success: { background:"#F0FDF4", border:"1.5px solid #BBF7D0", borderRadius:"14px", padding:"1.5rem", textAlign:"center" as const },
  sIcon:   { fontSize:"2rem", marginBottom:".5rem" },
  sTitle:  { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#166534", marginBottom:".3rem" },
  sSub:    { fontSize:".82rem", color:"#15803D" },
};

export default function AdminLodgeCorrection() {
  const [qcList,  setQcList]  = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState<any>(null);

  const [form, setForm] = useState({
    studentName:       "",
    studentEmail:      "",
    studentPhone:      "",
    topic:             "",
    chapterLabel:      "",
    degreeGroup:       "",
    department:        "",
    correctionRequest: "",
    qcId:              "",
    guidelineFileUrl:  "",
  });

  useEffect(() => {
    fetch("/api/admin/staff?role=QC&filter=approved")
      .then(r => r.json())
      .then(d => { if (d.success) setQcList(d.data || []); });
  }, []);

  function upd(key: string, val: string) {
    setForm(p => ({ ...p, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentName || !form.topic || !form.chapterLabel || !form.degreeGroup || !form.correctionRequest || !form.qcId) {
      toast.error("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/lodge-correction", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(data);
        toast.success(data.message);
      } else {
        toast.error(data.error || "Something went wrong.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setDone(null);
    setForm({ studentName:"", studentEmail:"", studentPhone:"", topic:"", chapterLabel:"", degreeGroup:"", department:"", correctionRequest:"", qcId:"", guidelineFileUrl:"" });
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Lodge Legacy Correction</h1>
        <p style={C.sub}>
          Use this for old clients who ordered before this system was set up. Creates a correction job directly with QC — no writer escalation needed since the original writer isn't traceable here.
        </p>

        {done ? (
          <div style={C.success}>
            <div style={C.sIcon}>✅</div>
            <div style={C.sTitle}>Correction Lodged Successfully</div>
            <div style={C.sSub}>{done.message}</div>
            <button onClick={reset}
              style={{marginTop:"1rem",padding:".6rem 1.25rem",borderRadius:"10px",background:"#0C1A2E",color:"#38BDF8",fontWeight:700,border:"none",cursor:"pointer",fontSize:".83rem"}}>
              Lodge Another →
            </button>
          </div>
        ) : (
          <div style={C.card}>
            <form onSubmit={handleSubmit}>

              {/* Client Info */}
              <div style={{...C.secHdr, borderTop:"none", paddingTop:0, marginTop:0}}>👤 Client Information</div>
              <div style={C.fg}>
                <label style={C.lbl}>Client Name <span style={{color:"#EF4444"}}>*</span></label>
                <input style={C.inp} value={form.studentName} onChange={e=>upd("studentName",e.target.value)} placeholder="e.g. John Doe" required />
              </div>
              <div style={C.grid}>
                <div style={C.fg}>
                  <label style={C.lbl}>Client Email <span style={{color:"#5B7EA6",fontWeight:400}}>(optional)</span></label>
                  <input style={C.inp} type="email" value={form.studentEmail} onChange={e=>upd("studentEmail",e.target.value)} placeholder="john@email.com" />
                  <div style={C.hint}>If provided, we'll check if they already have an account</div>
                </div>
                <div style={C.fg}>
                  <label style={C.lbl}>WhatsApp Number <span style={{color:"#5B7EA6",fontWeight:400}}>(optional)</span></label>
                  <input style={C.inp} value={form.studentPhone} onChange={e=>upd("studentPhone",e.target.value)} placeholder="08012345678" />
                </div>
              </div>

              {/* Project Info */}
              <div style={C.secHdr}>📋 Project Details</div>
              <div style={C.fg}>
                <label style={C.lbl}>Project Topic <span style={{color:"#EF4444"}}>*</span></label>
                <input style={C.inp} value={form.topic} onChange={e=>upd("topic",e.target.value)} placeholder="e.g. Impact of Social Media on Student Performance" required />
              </div>
              <div style={C.grid}>
                <div style={C.fg}>
                  <label style={C.lbl}>Chapter / Section <span style={{color:"#EF4444"}}>*</span></label>
                  <input style={C.inp} value={form.chapterLabel} onChange={e=>upd("chapterLabel",e.target.value)} placeholder="e.g. Chapter 3 or Full Project" required />
                </div>
                <div style={C.fg}>
                  <label style={C.lbl}>Degree Level <span style={{color:"#EF4444"}}>*</span></label>
                  <select style={C.sel} value={form.degreeGroup} onChange={e=>upd("degreeGroup",e.target.value)} required>
                    <option value="">Select level...</option>
                    {DEG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={C.fg}>
                <label style={C.lbl}>Department / Course</label>
                <input style={C.inp} value={form.department} onChange={e=>upd("department",e.target.value)} placeholder="e.g. Mass Communication" />
              </div>

              {/* Correction Details */}
              <div style={C.secHdr}>🔧 Correction Details</div>
              <div style={C.fg}>
                <label style={C.lbl}>What Needs Correcting <span style={{color:"#EF4444"}}>*</span></label>
                <textarea style={C.ta} value={form.correctionRequest} onChange={e=>upd("correctionRequest",e.target.value)}
                  placeholder="Describe what the client wants corrected or improved..." required />
              </div>
              <div style={C.fg}>
                <label style={C.lbl}>Original Work / Guideline File URL <span style={{color:"#5B7EA6",fontWeight:400}}>(optional)</span></label>
                <input style={C.inp} value={form.guidelineFileUrl} onChange={e=>upd("guidelineFileUrl",e.target.value)} placeholder="Paste a Cloudinary or Google Drive link" />
                <div style={C.hint}>Upload the client's original file to Cloudinary first, then paste the URL here</div>
              </div>

              {/* QC Assignment */}
              <div style={C.secHdr}>🔍 Assign to QC</div>
              <div style={C.fg}>
                <label style={C.lbl}>Select QC Staff Member <span style={{color:"#EF4444"}}>*</span></label>
                <select style={C.sel} value={form.qcId} onChange={e=>upd("qcId",e.target.value)} required>
                  <option value="">Select QC...</option>
                  {qcList.map((q:any) => (
                    <option key={q.id} value={q.id}>{q.name}</option>
                  ))}
                </select>
                <div style={C.hint}>The selected QC will receive an email notification and see this in their Pending Corrections tab</div>
              </div>

              <button type="submit" disabled={loading} style={{...C.btn,...(loading?C.btnD:{})}}>
                {loading ? "Lodging Correction..." : "🔧 Lodge Correction →"}
              </button>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
