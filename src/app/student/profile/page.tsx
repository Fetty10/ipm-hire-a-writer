"use client";
// src/app/student/profile/page.tsx
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";
import { Input, Button, Spinner } from "@/components/ui";
import toast from "react-hot-toast";
import bcrypt from "bcryptjs";

export default function StudentProfile() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(()=>{
    fetch("/api/staff/profile").then(r=>r.json()).then(d=>{
      if(d.success){ setName(d.data.name||""); setPhone(d.data.phone||""); setEmail(d.data.email||""); }
      setLoading(false);
    });
  },[]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch("/api/staff/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,phone})});
    const data = await res.json();
    if(res.ok) toast.success("Profile updated."); else toast.error(data.error);
    setSaving(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if(newPw!==confirmPw){ toast.error("Passwords do not match."); return; }
    if(newPw.length<8){ toast.error("Min. 8 characters."); return; }
    setPwSaving(true);
    const res = await fetch("/api/staff/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:currentPw,newPassword:newPw})});
    const data = await res.json();
    if(res.ok){ toast.success("Password updated."); setCurrentPw(""); setNewPw(""); setConfirmPw(""); } else toast.error(data.error);
    setPwSaving(false);
  }

  return (
    <StudentLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">My Profile</h1>
        <p className="text-sm text-navy-muted mb-5">Manage your account details.</p>
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div> : <>
          <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5 mb-4">
            <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-4">Personal Information</h2>
            <form onSubmit={saveProfile} className="flex flex-col gap-4">
              <Input label="Full Name" value={name} onChange={e=>setName(e.target.value)} />
              <Input label="Phone Number" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+234 800 000 0000" />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider">Email Address</label>
                <input value={email} disabled className="w-full px-4 py-3 rounded-xl border border-sky-100 bg-sky-50 text-navy-muted text-sm cursor-not-allowed" />
                <p className="text-xs text-navy-muted">Email cannot be changed.</p>
              </div>
              <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
            </form>
          </div>
          <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5">
            <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-4">Change Password</h2>
            <form onSubmit={savePassword} className="flex flex-col gap-4">
              <Input label="Current Password" type="password" value={currentPw} onChange={e=>setCurrentPw(e.target.value)} placeholder="••••••••" />
              <Input label="New Password" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min. 8 characters" />
              <Input label="Confirm New Password" type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Re-enter" />
              <Button type="submit" variant="outline" loading={pwSaving}>Update Password</Button>
            </form>
          </div>
        </>}
      </div>
    </StudentLayout>
  );
}
