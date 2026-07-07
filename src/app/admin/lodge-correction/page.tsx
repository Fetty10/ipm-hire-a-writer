"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";

const DEG_OPTIONS = [
  { value:"OND_HND_NCE", label:"HND / OND / NCE" },
  { value:"BSC_BED_BA",  label:"BSc / BEd / BA"  },
  { value:"PGD_MSC_PHD", label:"PGD / MSc"       },
  { value:"PHD",         label:"PhD"              },
];

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp,.zip";
const MAX_FILES = 10;

const C = {
  page:   { maxWidth:"640px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.5rem", fontWeight:800, color:"#0C1A2E", marginBottom:".25rem" },
  sub:    { fontSize:".82rem", color:"#5B7EA6", marginBottom:"1.75rem", lineHeight:1.6 },
  card:   { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.5rem" },
  secHdr: { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", marginBottom:".75rem", marginTop:"1.25rem", borderTop:"1px solid #F0F9FF", paddingTop:"1.25rem" },
  fg:     { marginBottom:"1rem" },
  lbl:    { display:"block", fontSize:".72rem", fontWeight:700, color:"#0C1A2E", marginBottom:".35rem" },
  inp:    { width:"100%", padding:".6rem .9rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  sel:    { width:"100%", padding:".6rem .9rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff", boxSizing:"border-box" as const },
  ta:     { width:"100%", padding:".6rem .9rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"100px", boxSizing:"border-box" as const },
  grid:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:".75rem" },
  hint:   { fontSize:".7rem", color:"#5B7EA6", marginTop:".3rem" },
  btn:    { width:"100%", padding:".85rem", borderRadius:"12px", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, border:"none", cursor:"pointer", marginTop:"1.25rem", fontFamily:"'DM Sans',sans-serif" },
  btnD:   { opacity:.6, cursor:"not-allowed" as const },
  // Upload zone
  dropzone:{ border:"2px dashed #BAE6FD", borderRadius:"12px", padding:"1.5rem", textAlign:"center" as const, cursor:"pointer", background:"#F8FCFF", transition:"background .15s" },
  dropzoneActive:{ background:"#E0F2FE", borderColor:"#38BDF8" },
  fileList:{ marginTop:".75rem", display:"flex", flexDirection:"column" as const, gap:".4rem" },
  fileItem:{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"#F0F9FF", borderRadius:"8px", padding:".5rem .75rem", fontSize:".78rem" },
  fileOk:  { color:"#065F46", fontSize:".7rem", fontWeight:700 },
  fileErr: { color:"#991B1B", fontSize:".7rem", fontWeight:700 },
  fileRm:  { background:"none", border:"none", cursor:"pointer", color:"#EF4444", fontSize:".85rem", padding:"0 .25rem" },
  progress:{ height:"4px", borderRadius:"2px", background:"#E0F2FE", marginTop:".3rem", overflow:"hidden" },
  progressBar:{ height:"100%", background:"#38BDF8", transition:"width .2s" },
  // Success
  success: { background:"#F0FDF4", border:"1.5px solid #BBF7D0", borderRadius:"14px", padding:"1.5rem", textAlign:"center" as const },
  sIcon:   { fontSize:"2rem", marginBottom:".5rem" },
  sTitle:  { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#166534", marginBottom:".3rem" },
  sSub:    { fontSize:".82rem", color:"#15803D" },
};

interface UploadedFile {
  name:     string;
  url:      string;
  done:     boolean;
  err?:     string;
  progress: number;
}

export default function AdminLodgeCorrection() {
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState<any>(null);
  const [dragging,  setDragging]  = useState(false);
  const [files,     setFiles]     = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    studentName:       "",
    studentEmail:      "",
    studentPhone:      "",
    topic:             "",
    chapterLabel:      "",
    degreeGroup:       "",
    department:        "",
    correctionRequest: "",
  });

  function upd(key: string, val: string) {
    setForm(p => ({ ...p, [key]: val }));
  }

  async function uploadFile(file: File) {
    const id = file.name + Date.now();
    setFiles(prev => [...prev, { name: file.name, url: "", done: false, progress: 0 }]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "admin/legacy-files");

    // Simulate progress since fetch doesn't expose upload progress easily
    const interval = setInterval(() => {
      setFiles(prev => prev.map(f =>
        f.name === file.name && !f.done ? { ...f, progress: Math.min(f.progress + 15, 85) } : f
      ));
    }, 200);

    try {
      const res  = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      clearInterval(interval);
      if (res.ok) {
        setFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, url: data.url, done: true, progress: 100 } : f
        ));
      } else {
        setFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, err: data.error || "Upload failed", progress: 0 } : f
        ));
      }
    } catch {
      clearInterval(interval);
      setFiles(prev => prev.map(f =>
        f.name === file.name ? { ...f, err: "Network error", progress: 0 } : f
      ));
    }
  }

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return;
    const total = files.length + incoming.length;
    if (total > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed.`);
      return;
    }
    Array.from(incoming).forEach(uploadFile);
  }

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentName || !form.studentEmail || !form.topic || !form.chapterLabel || !form.degreeGroup || !form.correctionRequest) {
      toast.error("Please fill all required fields including client email.");
      return;
    }
    const pending = files.filter(f => !f.done && !f.err);
    if (pending.length > 0) {
      toast.error("Please wait for all files to finish uploading.");
      return;
    }
    const uploadedUrls = files.filter(f => f.done && f.url).map(f => f.url);

    setLoading(true);
    try {
      const res  = await fetch("/api/admin/lodge-correction", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          guidelineFileUrl: uploadedUrls.join(",") || undefined,
        }),
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
    setFiles([]);
    setForm({ studentName:"", studentEmail:"", studentPhone:"", topic:"", chapterLabel:"", degreeGroup:"", department:"", correctionRequest:"" });
  }

  const uploadedCount = files.filter(f => f.done).length;
  const allUploaded   = files.length > 0 && files.every(f => f.done || f.err);

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Lodge Legacy Correction</h1>
        <p style={C.sub}>
          For clients who ordered before this system. Creates a correction job and assigns it automatically to the next QC in rotation — no writer involvement needed.
        </p>

        {done ? (
          <div style={C.success}>
            <div style={C.sIcon}>✅</div>
            <div style={C.sTitle}>Correction Lodged Successfully</div>
            <div style={C.sSub}>{done.message}</div>
            {done.accountCreated && (
              <div style={{marginTop:".75rem",fontSize:".78rem",color:"#15803D",background:"#DCFCE7",borderRadius:"8px",padding:".6rem 1rem"}}>
                📧 Account created — login credentials emailed to client. They'll also receive the corrected file directly by email once QC is done.
              </div>
            )}
            {!done.accountCreated && (
              <div style={{marginTop:".75rem",fontSize:".78rem",color:"#0369A1",background:"#E0F2FE",borderRadius:"8px",padding:".6rem 1rem"}}>
                ℹ️ Existing account found — correction assigned. Client will be emailed when it's ready.
              </div>
            )}
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
                  <label style={C.lbl}>Client Email <span style={{color:"#EF4444"}}>*</span></label>
                  <input style={C.inp} type="email" value={form.studentEmail} onChange={e=>upd("studentEmail",e.target.value)} placeholder="john@email.com" required />
                  <div style={C.hint}>Login credentials will be emailed here. Corrected work will also be sent to this address.</div>
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

              {/* File Upload */}
              <div style={C.secHdr}>📎 Upload Client's Files</div>
              <div style={C.hint}>Up to {MAX_FILES} files · PDF, Word, Excel, PowerPoint, images (JPG/PNG), ZIP · 20MB each</div>
              <div style={{marginTop:".75rem",marginBottom:".5rem"}}>
                <input ref={fileInputRef} type="file" accept={ACCEPTED} multiple style={{display:"none"}}
                  onChange={e => handleFiles(e.target.files)} />
                <div
                  style={{...C.dropzone, ...(dragging?C.dropzoneActive:{})}}
                  onDragOver={e=>{e.preventDefault();setDragging(true);}}
                  onDragLeave={()=>setDragging(false)}
                  onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}}
                  onClick={()=>fileInputRef.current?.click()}>
                  <div style={{fontSize:"1.5rem",marginBottom:".4rem"}}>📁</div>
                  <div style={{fontSize:".83rem",fontWeight:700,color:"#0C1A2E"}}>Click to browse or drag & drop files here</div>
                  <div style={{fontSize:".72rem",color:"#5B7EA6",marginTop:".25rem"}}>
                    {files.length > 0 ? `${uploadedCount}/${files.length} uploaded` : "No files selected yet"}
                    {files.length < MAX_FILES ? ` · ${MAX_FILES - files.length} slots remaining` : " · Maximum reached"}
                  </div>
                </div>

                {files.length > 0 && (
                  <div style={C.fileList}>
                    {files.map((f, i) => (
                      <div key={i} style={C.fileItem}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:".78rem",color:"#0C1A2E",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>
                            {f.name}
                          </div>
                          {!f.done && !f.err && (
                            <div style={C.progress}>
                              <div style={{...C.progressBar, width:`${f.progress}%`}} />
                            </div>
                          )}
                          {f.done && <div style={C.fileOk}>✓ Uploaded</div>}
                          {f.err  && <div style={C.fileErr}>✕ {f.err}</div>}
                        </div>
                        <button type="button" style={C.fileRm} onClick={()=>removeFile(f.name)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QC Assignment note */}
              <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:"10px",padding:".85rem 1rem",marginTop:"1rem",fontSize:".78rem",color:"#0369A1"}}>
                🔄 <strong>Auto-assigned</strong> — QC staff will be assigned automatically by round-robin rotation, skipping suspended staff. The assigned QC will be notified by email immediately.
              </div>

              <button type="submit" disabled={loading || (files.length > 0 && !allUploaded)}
                style={{...C.btn,...(loading || (files.length > 0 && !allUploaded) ? C.btnD:{})}}>
                {loading ? "Lodging Correction..." : "🔧 Lodge Correction →"}
              </button>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
