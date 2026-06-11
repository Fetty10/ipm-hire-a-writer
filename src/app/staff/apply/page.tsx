"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const C = {
  wrap:  { minHeight:"100vh", background:"#0C1A2E", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"'DM Sans',sans-serif" },
  box:   { width:"100%", maxWidth:"480px" },
  logo:  { textAlign:"center" as const, marginBottom:"2rem" },
  lname: { fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#fff" },
  lspan: { color:"#38BDF8" },
  lsub:  { fontSize:".85rem", color:"#5B7EA6", marginTop:".3rem" },
  ltag:  { display:"inline-block", marginTop:".5rem", padding:"3px 12px", borderRadius:"999px", background:"rgba(56,189,248,.15)", color:"#38BDF8", fontSize:".72rem", fontWeight:700, border:"1px solid rgba(56,189,248,.2)" },
  card:  { background:"#112240", borderRadius:"20px", border:"1.5px solid rgba(56,189,248,.15)", boxShadow:"0 8px 32px rgba(0,0,0,.3)", padding:"1.75rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#7DD3FC", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid rgba(56,189,248,.2)", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, background:"rgba(255,255,255,.05)", color:"#fff" },
  sel:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid rgba(56,189,248,.2)", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const, background:"#112240", color:"#fff" },
  hint:  { fontSize:".7rem", color:"#5B7EA6", marginTop:".3rem" },
  err:   { fontSize:".75rem", color:"#FCA5A5", fontWeight:600, marginBottom:".75rem" },
  btn:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { opacity:.6, cursor:"not-allowed" as const },
  foot:  { textAlign:"center" as const, fontSize:".82rem", color:"#5B7EA6", marginTop:"1.25rem" },
  flink: { background:"none", border:"none", color:"#38BDF8", fontWeight:700, cursor:"pointer", fontSize:".82rem" },
  notice:{ background:"rgba(56,189,248,.08)", border:"1px solid rgba(56,189,248,.15)", borderRadius:"12px", padding:".9rem 1.25rem", marginBottom:"1.25rem", fontSize:".78rem", color:"#7DD3FC" },
  upzone:{ border:"2px dashed rgba(56,189,248,.3)", borderRadius:"12px", padding:"1.25rem", textAlign:"center" as const, cursor:"pointer", background:"rgba(56,189,248,.04)", transition:"all .2s" },
  upzoneOk:{ border:"2px dashed #4ADE80", borderRadius:"12px", padding:"1.25rem", textAlign:"center" as const, cursor:"pointer", background:"rgba(74,222,128,.04)" },
  upi:   { fontSize:"1.3rem", marginBottom:".3rem" },
  uplbl: { fontSize:".8rem", fontWeight:600, color:"#BAE6FD" },
  upsub: { fontSize:".7rem", color:"#5B7EA6", marginTop:".15rem" },
  upok:  { fontSize:".8rem", fontWeight:600, color:"#4ADE80" },
  upspin:{ fontSize:".8rem", fontWeight:600, color:"#7DD3FC" },
  divider:{ borderTop:"1px solid rgba(56,189,248,.1)", margin:"1.25rem 0" },
  sectitle:{ fontFamily:"'Syne',sans-serif", fontSize:".82rem", fontWeight:700, color:"#38BDF8", textTransform:"uppercase" as const, letterSpacing:".08em", marginBottom:"1rem" },
  success:{ textAlign:"center" as const, padding:"2rem" },
  sicon: { fontSize:"2.5rem", marginBottom:"1rem" },
  stitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:"#fff", marginBottom:".5rem" },
  ssub:  { fontSize:".83rem", color:"#5B7EA6", marginBottom:"1.5rem", lineHeight:1.6 },
  backBox:{ textAlign:"center" as const, marginTop:"1.25rem" },
  backBtn:{ background:"none", border:"none", color:"#5B7EA6", fontSize:".78rem", cursor:"pointer", textDecoration:"underline" },
};

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res  = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

interface UploadFieldProps {
  label: string;
  hint: string;
  value: string;
  uploading: boolean;
  fileName: string;
  onUpload: (file: File) => void;
}

function UploadField({ label, hint, value, uploading, fileName, onUpload }: UploadFieldProps) {
  function handleClick() {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".pdf,.doc,.docx";
    inp.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) onUpload(f);
    };
    inp.click();
  }

  return (
    <div style={C.fg}>
      <label style={C.lbl}>{label}</label>
      <div style={value ? C.upzoneOk : C.upzone} onClick={handleClick}>
        {uploading ? (
          <div><div style={C.upi}>⏳</div><div style={C.upspin}>Uploading...</div></div>
        ) : value ? (
          <div><div style={C.upi}>✅</div><div style={C.upok}>{fileName || "File uploaded"}</div><div style={C.upsub}>Tap to replace</div></div>
        ) : (
          <div><div style={C.upi}>📄</div><div style={C.uplbl}>Upload {label}</div><div style={C.upsub}>PDF or Word (.docx) · Max 20MB</div></div>
        )}
      </div>
      <div style={C.hint}>{hint}</div>
    </div>
  );
}

function StaffApplyForm() {
  const router = useRouter();

  // Account fields
  const [role,     setRole]     = useState("WRITER");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");

  // Upload fields
  const [cvUrl,       setCvUrl]       = useState("");
  const [cvName,      setCvName]      = useState("");
  const [cvUploading, setCvUploading] = useState(false);
  const [sampleUrl,       setSampleUrl]       = useState("");
  const [sampleName,      setSampleName]      = useState("");
  const [sampleUploading, setSampleUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  async function handleCvUpload(file: File) {
    if (file.size > 20 * 1024 * 1024) { setError("CV file must be under 20MB."); return; }
    setCvUploading(true);
    try {
      const url = await uploadFile(file, "staff/cv");
      setCvUrl(url); setCvName(file.name);
    } catch (e: any) { setError(e.message); }
    finally { setCvUploading(false); }
  }

  async function handleSampleUpload(file: File) {
    if (file.size > 20 * 1024 * 1024) { setError("Sample file must be under 20MB."); return; }
    setSampleUploading(true);
    try {
      const url = await uploadFile(file, "staff/samples");
      setSampleUrl(url); setSampleName(file.name);
    } catch (e: any) { setError(e.message); }
    finally { setSampleUploading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    if (!cvUrl)     { setError("Please upload your CV."); return; }
    if (!sampleUrl) { setError("Please upload a work sample."); return; }

    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role, cvUrl, sampleUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Application failed. Please try again."); return; }
      setSuccess(true);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  if (success) {
    return (
      <div style={C.wrap}>
        <div style={C.box}>
          <div style={C.card}>
            <div style={C.success}>
              <div style={C.sicon}>⏳</div>
              <div style={C.stitle}>Application Submitted!</div>
              <div style={C.ssub}>
                Thank you for applying. Our admin team will review your CV and work sample. You'll be notified by email once your account is approved — usually within 1–2 business days.
              </div>
              <button style={C.btn} onClick={() => router.push("/staff/login")}>Back to Staff Login</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={C.wrap}>
      <div style={C.box}>
        <div style={C.logo}>
          <div style={C.lname}>iProject<span style={C.lspan}>Master</span></div>
          <div style={C.lsub}>Staff Application</div>
          <div style={C.ltag}>Join our writing team</div>
        </div>

        <div style={C.notice}>
          ℹ Your application will be reviewed by our admin team before you can log in. Attach your CV and a sample of your academic writing work.
        </div>

        <div style={C.card}>
          <form onSubmit={handleSubmit}>

            {/* Role */}
            <div style={C.fg}>
              <label style={C.lbl}>Applying as</label>
              <select style={C.sel} value={role} onChange={e => setRole(e.target.value)}>
                <option value="WRITER">Writer</option>
                <option value="ANALYST">Analyst</option>
                <option value="QC">Quality Control</option>
              </select>
            </div>

            {/* Personal info */}
            <div style={C.sectitle}>Personal Information</div>
            <div style={C.fg}><label style={C.lbl}>Full Name</label><input style={C.inp} value={name} onChange={e=>setName(e.target.value)} required placeholder="Your full name" /></div>
            <div style={C.fg}><label style={C.lbl}>Phone Number</label><input style={C.inp} value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="08012345678" /></div>
            <div style={C.fg}><label style={C.lbl}>Email Address</label><input style={C.inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="your@email.com" /></div>

            {/* Password */}
            <div style={C.divider} />
            <div style={C.sectitle}>Set Your Password</div>
            <div style={C.fg}><label style={C.lbl}>Password</label><input style={C.inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="Min. 8 characters" /></div>
            <div style={C.fg}><label style={C.lbl}>Confirm Password</label><input style={C.inp} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Re-enter password" /></div>

            {/* Uploads */}
            <div style={C.divider} />
            <div style={C.sectitle}>Your Documents</div>

            <UploadField
              label="CV / Resume"
              hint="Upload your most recent CV. PDF or Word format."
              value={cvUrl}
              uploading={cvUploading}
              fileName={cvName}
              onUpload={handleCvUpload}
            />

            <UploadField
              label="Work Sample"
              hint="Upload a sample of your academic writing — a chapter, project, or article you've written."
              value={sampleUrl}
              uploading={sampleUploading}
              fileName={sampleName}
              onUpload={handleSampleUpload}
            />

            {error && <p style={C.err}>{error}</p>}

            <button type="submit"
              disabled={loading || cvUploading || sampleUploading}
              style={{...C.btn,...(loading||cvUploading||sampleUploading?C.btnD:{})}}>
              {loading ? "Submitting..." : "Submit Application →"}
            </button>
          </form>

          <div style={C.foot}>
            Already have an account?{" "}
            <button style={C.flink} onClick={() => router.push("/staff/login")}>Staff Login</button>
          </div>
        </div>

        
      </div>
    </div>
  );
}

export default function StaffApplyPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#5B7EA6"}}>Loading...</div>}>
      <StaffApplyForm />
    </Suspense>
  );
}
