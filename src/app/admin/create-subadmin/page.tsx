"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";

const C = {
  page:  { maxWidth:"520px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"20px", border:"1.5px solid #E0F2FE", padding:"1.75rem" },
  fg:    { marginBottom:"1.1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".7rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  pw:    { position:"relative" as const },
  eye:   { position:"absolute" as const, right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"1rem" },
  btn:   { width:"100%", padding:".85rem", borderRadius:"12px", border:"none", background:"#0C1A2E", color:"#38BDF8", fontSize:".88rem", fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnD:  { opacity:.6, cursor:"not-allowed" as const },
  info:  { background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:"12px", padding:"1rem", fontSize:".8rem", color:"#0369A1", marginBottom:"1.25rem", lineHeight:1.6 },
  list:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden", marginTop:"2rem" },
  lrow:  { display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:"1rem", alignItems:"center", padding:".85rem 1.25rem", borderBottom:"1px solid #F0F9FF", fontSize:".82rem" },
  lhdr:  { display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:"1rem", padding:".6rem 1.25rem", background:"#F0F9FF", fontSize:".72rem", fontWeight:700, color:"#5B7EA6", textTransform:"uppercase" as const, letterSpacing:".06em" },
  badge: { padding:"2px 10px", borderRadius:"999px", fontSize:".7rem", fontWeight:700, background:"#EDE9FE", color:"#5B21B6" },
};

export default function AdminCreateSubAdmin() {
  const [form,    setForm]    = useState({ name:"", email:"", phone:"", password:"", confirmPw:"" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [admins,  setAdmins]  = useState<any[]>([]);
  const [loaded,  setLoaded]  = useState(false);

  function upd(k: string, v: string) { setForm(f => ({...f, [k]:v})); }

  async function loadAdmins() {
    const res  = await fetch("/api/admin/staff?role=SUB_ADMIN&filter=approved");
    const data = await res.json();
    if (data.success) setAdmins(data.data || []);
    setLoaded(true);
  }

  useState(() => { loadAdmins(); });

  async function handleAction(staffId: string, action: string, name: string) {
    if (action === "delete") {
      if (!window.confirm(`Permanently delete ${name}'s account?\n\nThis cannot be undone.`)) return;
    } else if (action === "suspend") {
      if (!window.confirm(`Suspend ${name}'s account? They will lose access immediately.`)) return;
    }
    try {
      const res  = await fetch("/api/admin/staff", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ staffId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          action === "delete" ? `${name}'s account deleted.` :
          action === "suspend" ? `${name} suspended.` : `${name} reinstated.`
        );
        loadAdmins();
      } else toast.error(data.error || "Something went wrong.");
    } catch { toast.error("Network error. Please try again."); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      toast.error("All fields are required."); return;
    }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirmPw) { toast.error("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res  = await fetch("/api/admin/create-subadmin", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name:form.name.trim(), email:form.email.trim().toLowerCase(), phone:form.phone.trim(), password:form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sub-admin account created for ${form.name}!`);
        setForm({ name:"", email:"", phone:"", password:"", confirmPw:"" });
        loadAdmins();
      } else {
        toast.error(data.error || "Something went wrong.");
      }
    } catch { toast.error("Network error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <AdminLayout mainAdminOnly>
      <div style={C.page}>
        <h1 style={C.h1}>Create Sub-Admin</h1>
        <p style={C.sub}>Create accounts for trusted team members who will help manage the platform.</p>

        <div style={C.info}>
          🔒 Sub-admins can confirm bank transfers, lodge corrections, manage orders and approve staff — but cannot view staff earnings, pricing settings or this page.
        </div>

        <div style={C.card}>
          <form onSubmit={handleCreate}>
            <div style={C.fg}>
              <label style={C.lbl}>Full Name</label>
              <input style={C.inp} value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="e.g. Amaka Obi" required />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Email Address</label>
              <input style={C.inp} type="email" value={form.email} onChange={e=>upd("email",e.target.value)} placeholder="amaka@email.com" required />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>WhatsApp Number</label>
              <input style={C.inp} value={form.phone} onChange={e=>upd("phone",e.target.value)} placeholder="08012345678" required />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Password</label>
              <div style={C.pw}>
                <input style={C.inp} type={showPw?"text":"password"} value={form.password} onChange={e=>upd("password",e.target.value)} placeholder="Min. 8 characters" required />
                <button type="button" style={C.eye} onClick={()=>setShowPw(p=>!p)}>{showPw?"🙈":"👁"}</button>
              </div>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Confirm Password</label>
              <input style={C.inp} type="password" value={form.confirmPw} onChange={e=>upd("confirmPw",e.target.value)} placeholder="Re-enter password" required />
            </div>
            <button type="submit" style={{...C.btn,...(loading?C.btnD:{})}} disabled={loading}>
              {loading ? "Creating Account..." : "➕ Create Sub-Admin Account"}
            </button>
          </form>
        </div>

        {/* Existing sub-admins */}
        {loaded && admins.length > 0 && (
          <div style={C.list}>
            <div style={{...C.lhdr, gridTemplateColumns:"1fr 1fr auto auto auto"}}>
              <span>Name</span><span>Email</span><span>Status</span><span></span><span></span>
            </div>
            {admins.map((a:any) => (
              <div key={a.id} style={{...C.lrow, gridTemplateColumns:"1fr 1fr auto auto auto"}}>
                <div>
                  <div style={{fontWeight:600,color:"#0C1A2E"}}>{a.name}</div>
                  <div style={{fontSize:".72rem",color:"#5B7EA6"}}>{a.phone}</div>
                </div>
                <div style={{fontSize:".78rem",color:"#5B7EA6"}}>{a.email}</div>
                <span style={{...C.badge,...(a.isSuspended?{background:"#FEE2E2",color:"#991B1B"}:{background:"#D1FAE5",color:"#065F46"})}}>
                  {a.isSuspended ? "Suspended" : "Active"}
                </span>
                <button
                  onClick={()=>handleAction(a.id, a.isSuspended ? "unsuspend" : "suspend", a.name)}
                  style={{padding:"3px 10px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:".72rem",fontWeight:700,
                    background: a.isSuspended ? "#D1FAE5" : "#FEF9C3",
                    color:      a.isSuspended ? "#065F46"  : "#854D0E"}}>
                  {a.isSuspended ? "♻️ Reinstate" : "🚫 Suspend"}
                </button>
                <button
                  onClick={()=>handleAction(a.id, "delete", a.name)}
                  style={{padding:"3px 10px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:".72rem",fontWeight:700,background:"#FEE2E2",color:"#991B1B"}}>
                  🗑 Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
