"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";

const C = {
  page:  { maxWidth:"520px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.5rem", marginBottom:"1rem" },
  ctitle:{ fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1.25rem" },
  fg:    { marginBottom:"1rem" },
  lbl:   { fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0C1A2E", display:"block", marginBottom:".4rem" },
  inp:   { width:"100%", padding:".75rem 1rem", borderRadius:"12px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  inpD:  { background:"#F8FBFF", color:"#5B7EA6", cursor:"not-allowed" as const },
  hint:  { fontSize:".72rem", color:"#5B7EA6", marginTop:".3rem" },
  btnP:  { width:"100%", padding:".75rem", borderRadius:"12px", background:"#38BDF8", color:"#0C1A2E", fontSize:".88rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnO:  { width:"100%", padding:".75rem", borderRadius:"12px", background:"#fff", color:"#0369A1", fontSize:".88rem", fontWeight:700, border:"1.5px solid #38BDF8", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};

export default function StudentProfile() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [conPw, setConPw] = useState("");

  useEffect(()=>{
    fetch("/api/staff/profile").then(r=>r.json()).then(d=>{
      if(d.success){ setName(d.data.name||""); setPhone(d.data.phone||""); setEmail(d.data.email||""); }
      setLoading(false);
    });
  },[]);

  async function saveProfile(e:React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/staff/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,phone})});
    const d   = await res.json();
    if(res.ok) alert("Profile updated!"); else alert(d.error);
    setSaving(false);
  }

  async function savePw(e:React.FormEvent) {
    e.preventDefault();
    if(newPw!==conPw){ alert("Passwords do not match."); return; }
    if(newPw.length<8){ alert("Min. 8 characters."); return; }
    setPwSaving(true);
    const res = await fetch("/api/staff/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:curPw,newPassword:newPw})});
    const d   = await res.json();
    if(res.ok){ alert("Password updated!"); setCurPw(""); setNewPw(""); setConPw(""); } else alert(d.error);
    setPwSaving(false);
  }

  return (
    <StudentLayout>
      <div style={C.page}>
        <h1 style={C.h1}>My Profile</h1>
        <p style={C.sub}>Manage your account details.</p>
        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <>
            <div style={C.card}>
              <div style={C.ctitle}>Personal Information</div>
              <form onSubmit={saveProfile}>
                <div style={C.fg}><label style={C.lbl}>Full Name</label><input style={C.inp} value={name} onChange={e=>setName(e.target.value)} /></div>
                <div style={C.fg}><label style={C.lbl}>Phone Number</label><input style={C.inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+234 800 000 0000" /></div>
                <div style={C.fg}>
                  <label style={C.lbl}>Email Address</label>
                  <input style={{...C.inp,...C.inpD}} value={email} disabled />
                  <div style={C.hint}>Email cannot be changed.</div>
                </div>
                <button type="submit" style={C.btnP} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
              </form>
            </div>
            <div style={C.card}>
              <div style={C.ctitle}>Change Password</div>
              <form onSubmit={savePw}>
                <div style={C.fg}><label style={C.lbl}>Current Password</label><input type="password" style={C.inp} value={curPw} onChange={e=>setCurPw(e.target.value)} placeholder="••••••••" /></div>
                <div style={C.fg}><label style={C.lbl}>New Password</label><input type="password" style={C.inp} value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min. 8 characters" /></div>
                <div style={C.fg}><label style={C.lbl}>Confirm Password</label><input type="password" style={C.inp} value={conPw} onChange={e=>setConPw(e.target.value)} placeholder="Re-enter" /></div>
                <button type="submit" style={C.btnO} disabled={pwSaving}>{pwSaving?"Updating...":"Update Password"}</button>
              </form>
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
