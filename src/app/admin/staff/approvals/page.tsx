"use client";
// src/app/admin/staff/approvals/page.tsx
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Spinner, Button } from "@/components/ui";
import toast from "react-hot-toast";

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
    if (res.ok) { toast.success(data.message); load(); }
    else toast.error(data.error);
    setActing(null);
  }

  return (
    <AdminLayout badges={{ "/admin/staff/approvals": staff.length }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Staff Approvals</h1>
        <p className="text-sm text-navy-muted mb-5">Review CV and work sample before approving or declining.</p>

        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        : staff.length === 0 ? (
          <div className="text-center py-16"><div className="text-4xl mb-3">✅</div><p className="text-navy-muted font-600">No pending approvals.</p></div>
        ) : (
          <div className="flex flex-col gap-4">
            {staff.map((s: any) => (
              <div key={s.id} className="bg-white rounded-2xl border border-sky-100 shadow-card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-700 text-navy-DEFAULT">{s.name}</h3>
                    <p className="text-xs text-navy-muted mt-1">
                      Applying as <strong>{s.role}</strong> · {s.email} · {s.phone}
                    </p>
                    <p className="text-xs text-navy-muted">Registered: {new Date(s.createdAt).toLocaleDateString("en-NG")}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-yellow-50 text-yellow-700 flex-shrink-0">Pending</span>
                </div>

                {/* CV and Sample links would come from Cloudinary URLs stored on registration */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="text-xs text-navy-muted italic">CV and work sample files would appear here after staff upload during registration.</span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button variant="primary" size="sm"
                    loading={acting === s.id + "approve"}
                    onClick={() => act(s.id, "approve")}>
                    ✓ Approve
                  </Button>
                  <Button variant="danger" size="sm"
                    loading={acting === s.id + "decline"}
                    onClick={() => act(s.id, "decline")}>
                    ✕ Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
