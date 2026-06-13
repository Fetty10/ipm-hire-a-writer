"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:  { maxWidth:"760px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  head:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  name:  { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  meta:  { fontSize:".78rem", color:"#5B7EA6", marginTop:".25rem" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, background:"#FEF9C3", color:"#854D0E", flexShrink:0 as const },
  files: { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".9rem 1rem", marginBottom:"1rem" },
  filest:{ fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".6rem" },
  fileRow:{ display:"flex", alignItems:"center", gap:".75rem", marginBottom:".4rem" },
  fileIcon:{ fontSize:"1.1rem" },
  fileLink:{ fontSize:".82rem", fontWeight:600, color:"#0369A1", textDecoration:"none" as const },
  noFile:{ fontSize:".78rem", color:"#5B7EA6", fontStyle:"italic" as const },
  btns:  { display:"flex", gap:".5rem" },
  btnG:  { padding:".55rem 1.25rem", borderRadius:"10px", background:"#D1FAE5", color:"#065F46", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnR:  { padding:".55rem 1.25rem", borderRadius:"10px", background:"#FEE2E2", color:"#991B1B", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
};

export default function StaffApprovals() {
  const [staff,   setStaff]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState<string|null>(null);

  async function load() {
    const res  = await fetch("/api/admin/staff?filter=pending");
    const data = await res.json();
    if (data.success) setStaff(data.data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function act(staffId: string, action: string) {
    setActing(staffId + action);
    const res  = await fetch("/api/admin/staff", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, action }),
    });
    const data = await res.json();
    if (res.ok) load(); else toast.error(data.error || "Something went wrong");
    setActing(null);
  }

  return (
    <AdminLayout badges={{ "/admin/staff/approvals": staff.length }}>
      <div style={C.page}>
        <h1 style={C.h1}>Staff Approvals</h1>
        <p style={C.sub}>Review CV and work sample before approving or declining.</p>

        {loading ? <div style={{ textAlign:"center", padding:"3rem", color:"#5B7EA6" }}>Loading...</div>
        : staff.length === 0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>✅</div>
            <div style={C.etitle}>No pending approvals.</div>
          </div>
        ) : staff.map((s: any) => (
          <div key={s.id} style={C.card}>
            <div style={C.head}>
              <div>
                <div style={C.name}>{s.name}</div>
                <div style={C.meta}>Applying as <strong>{s.role}</strong> · {s.email}</div>
                <div style={C.meta}>Phone: {s.phone} · Applied: {new Date(s.createdAt).toLocaleDateString("en-NG")}</div>
              </div>
              <span style={C.badge}>Pending Review</span>
            </div>

            {/* CV and Work Sample */}
            <div style={C.files}>
              <div style={C.filest}>Application Documents</div>
              <div style={C.fileRow}>
                <span style={C.fileIcon}>📄</span>
                {s.cvFileUrl
                  ? <a href={s.cvFileUrl} target="_blank" rel="noreferrer" style={C.fileLink}>Download CV / Resume</a>
                  : <span style={C.noFile}>No CV uploaded</span>}
              </div>
              <div style={C.fileRow}>
                <span style={C.fileIcon}>📝</span>
                {s.sampleFileUrl
                  ? <a href={s.sampleFileUrl} target="_blank" rel="noreferrer" style={C.fileLink}>Download Work Sample</a>
                  : <span style={C.noFile}>No work sample uploaded</span>}
              </div>
            </div>

            <div style={C.btns}>
              <button style={C.btnG} disabled={acting === s.id + "approve"} onClick={() => act(s.id, "approve")}>
                {acting === s.id + "approve" ? "Approving..." : "✓ Approve"}
              </button>
              <button style={C.btnR} disabled={acting === s.id + "decline"} onClick={() => act(s.id, "decline")}>
                {acting === s.id + "decline" ? "Declining..." : "✕ Decline"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
