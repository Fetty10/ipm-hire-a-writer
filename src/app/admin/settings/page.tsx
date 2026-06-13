"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:  { maxWidth:"520px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.5rem", marginBottom:"1rem" },
  ctitle:{ fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1.25rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".7rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  btnP:  { width:"100%", padding:".75rem", borderRadius:"12px", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  warn:  { background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:"12px", padding:"1rem 1.25rem", fontSize:".82rem", color:"#9A3412" },
  wt:    { fontWeight:700, marginBottom:".4rem" },
};

export default function AdminSettings() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving,    setSaving]    = useState(false);

  async function save(e:React.FormEvent) {
    e.preventDefault();
    if(newPw!==confirmPw){ toast.error("Passwords do not match."); return; }
    if(newPw.length<8)   { toast.error("Min. 8 characters."); return; }
    setSaving(true);
    const res  = await fetch("/api/staff/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:currentPw,newPassword:newPw})});
    const data = await res.json();
    if(res.ok){ toast.success("Password updated."); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    else toast.error(data.error || "Something went wrong");
    setSaving(false);
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Settings</h1>
        <p style={C.sub}>Admin account configuration.</p>

        <div style={C.card}>
          <div style={C.ctitle}>Change Admin Password</div>
          <form onSubmit={save}>
            {[
              {label:"Current Password",    val:currentPw, set:setCurrentPw},
              {label:"New Password",        val:newPw,     set:setNewPw},
              {label:"Confirm New Password",val:confirmPw, set:setConfirmPw},
            ].map(f=>(
              <div key={f.label} style={C.fg}>
                <label style={C.lbl}>{f.label}</label>
                <input type="password" style={C.inp} value={f.val} onChange={e=>f.set(e.target.value)} placeholder="••••••••" />
              </div>
            ))}
            <button type="submit" style={C.btnP} disabled={saving}>{saving?"Updating...":"Update Password"}</button>
          </form>
        </div>

        <div style={C.warn}>
          <div style={C.wt}>⚠ Default Admin Credentials</div>
          <div>Email: admin@iprojectmaster.com</div>
          <div>Password: Admin@IPM2025!</div>
          <div style={{marginTop:".5rem",color:"#EF4444",fontWeight:700}}>Change these immediately if you haven't already.</div>
        </div>
      </div>
    </AdminLayout>
  );
}
