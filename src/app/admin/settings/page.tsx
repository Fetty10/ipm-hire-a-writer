export const dynamic = "force-dynamic";
"use client";
// src/app/admin/settings/page.tsx
import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input, Button } from "@/components/ui";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error("Passwords do not match."); return; }
    if (newPw.length < 8)   { toast.error("Min. 8 characters."); return; }
    setPwSaving(true);
    const res  = await fetch("/api/staff/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Password updated."); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    else toast.error(data.error);
    setPwSaving(false);
  }

  return (
    <AdminLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Settings</h1>
        <p className="text-sm text-navy-muted mb-5">Admin account and site configuration.</p>

        <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5 mb-4">
          <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-4">Change Admin Password</h2>
          <form onSubmit={savePassword} className="flex flex-col gap-4">
            <Input label="Current Password" type="password" value={currentPw} onChange={e=>setCurrentPw(e.target.value)} placeholder="••••••••" />
            <Input label="New Password" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min. 8 characters" />
            <Input label="Confirm New Password" type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Re-enter" />
            <Button type="submit" variant="primary" loading={pwSaving}>Update Password</Button>
          </form>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-800">
          <p className="font-700 mb-1">Default Admin Credentials</p>
          <p>Email: <strong>admin@iprojectmaster.com</strong></p>
          <p>Password: <strong>Admin@IPM2025!</strong></p>
          <p className="mt-2 text-red-600 font-700">⚠ Change these immediately after first login.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
