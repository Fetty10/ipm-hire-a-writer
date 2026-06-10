"use client";
// src/components/staff/ProfilePage.tsx
// Shared profile page — used by Writer, Analyst, QC

import { useEffect, useState } from "react";
import { Card, Input, Button, Spinner } from "@/components/ui";
import toast from "react-hot-toast";

interface Profile {
  name: string; email: string; phone: string;
  role: string; createdAt: string;
}

export function ProfilePage() {
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Profile fields
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");

  // Password fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    async function load() {
      const res  = await fetch("/api/staff/profile");
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setName(data.data.name  || "");
        setPhone(data.data.phone || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res  = await fetch("/api/staff/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    if (res.ok) toast.success("Profile updated.");
    else        toast.error(data.error);
    setSaving(false);
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error("Passwords do not match."); return; }
    if (newPw.length < 8)    { toast.error("Password must be at least 8 characters."); return; }
    setPwSaving(true);
    const res  = await fetch("/api/staff/profile", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Password updated.");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      toast.error(data.error);
    }
    setPwSaving(false);
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">
        My Profile
      </h1>
      <p className="text-sm text-navy-muted mb-5">
        Manage your account details.
      </p>

      {/* Personal Info */}
      <Card className="mb-4">
        <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-4">Personal Information</h2>
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
          />
          <Input
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 800 000 0000"
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider">
              Email Address
            </label>
            <input
              value={profile?.email || ""}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-sky-100 bg-sky-50 text-navy-muted text-sm cursor-not-allowed"
            />
            <p className="text-xs text-navy-muted">Email cannot be changed. Contact admin if needed.</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider">
              Role
            </label>
            <input
              value={profile?.role || ""}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-sky-100 bg-sky-50 text-navy-muted text-sm cursor-not-allowed"
            />
          </div>
          <Button type="submit" variant="primary" loading={saving}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-4">Change Password</h2>
        <form onSubmit={savePassword} className="flex flex-col gap-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            label="New Password"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="Min. 8 characters"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Re-enter new password"
          />
          <Button type="submit" variant="outline" loading={pwSaving}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
