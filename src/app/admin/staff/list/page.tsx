export const dynamic = "force-dynamic";
"use client";
// src/app/admin/staff/list/page.tsx
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Spinner, Button } from "@/components/ui";
import toast from "react-hot-toast";

const ROLES = ["all","WRITER","ANALYST","QC"];

export default function StaffList() {
  const [staff,   setStaff]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role,    setRole]    = useState("all");
  const [search,  setSearch]  = useState("");
  const [acting,  setActing]  = useState<string|null>(null);
  const [modal,   setModal]   = useState<{id:string;action:string;name:string}|null>(null);
  const [reason,  setReason]  = useState("");

  async function load() {
    setLoading(true);
    const res  = await fetch(`/api/admin/staff?role=${role}&search=${encodeURIComponent(search)}&filter=active`);
    const data = await res.json();
    if (data.success) setStaff(data.data);
    setLoading(false);
  }
  useEffect(() => { load(); }, [role, search]);

  async function act(staffId: string, action: string) {
    setActing(staffId);
    const res  = await fetch("/api/admin/staff", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, action, reason }),
    });
    const data = await res.json();
    if (res.ok) { toast.success(data.message); setModal(null); setReason(""); load(); }
    else toast.error(data.error);
    setActing(null);
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">All Staff</h1>
        <p className="text-sm text-navy-muted mb-5">Manage writers, analysts and QC staff.</p>

        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-muted text-sm">🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or phone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <select value={role} onChange={e=>setRole(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
            {ROLES.map(r=><option key={r} value={r}>{r==="all"?"All Roles":r}</option>)}
          </select>
        </div>

        {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div> : (
          <div className="bg-white rounded-2xl border border-sky-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-sky-100 bg-sky-50/50">
                  {["Name","Phone","Email","Role","Active Jobs","Total Earned","Status","Actions"].map(h=>
                    <th key={h} className="text-left py-3 px-4 text-[.6rem] font-700 uppercase tracking-wider text-navy-muted whitespace-nowrap">{h}</th>
                  )}
                </tr></thead>
                <tbody>
                  {staff.map((s:any)=>(
                    <tr key={s.id} className="border-b border-sky-50 hover:bg-sky-50/30">
                      <td className="py-3 px-4 font-700 whitespace-nowrap">{s.name}</td>
                      <td className="py-3 px-4 text-navy-muted">{s.phone}</td>
                      <td className="py-3 px-4 text-navy-muted max-w-[140px] truncate">{s.email}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[.65rem] font-700 bg-sky-100 text-sky-700">{s.role}</span></td>
                      <td className="py-3 px-4 text-center">{s.activeJobs}</td>
                      <td className="py-3 px-4 font-700 text-sky-600">₦{(s.totalEarnedNaira||0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[.65rem] font-700 ${s.isSuspended?"bg-red-50 text-red-700":"bg-green-50 text-green-700"}`}>
                          {s.isSuspended?"Suspended":"Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {s.isSuspended
                          ? <button onClick={()=>act(s.id,"unsuspend")} disabled={acting===s.id}
                              className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-700 hover:bg-green-100 disabled:opacity-50">
                              Unsuspend
                            </button>
                          : <button onClick={()=>setModal({id:s.id,action:"suspend",name:s.name})}
                              className="px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-xs font-700 hover:bg-yellow-100">
                              Suspend
                            </button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Suspend modal */}
        {modal && (
          <div className="fixed inset-0 bg-navy/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-card-hover">
              <h3 className="font-clash text-base font-700 text-navy-DEFAULT mb-2">Suspend {modal.name}?</h3>
              <p className="text-xs text-navy-muted mb-4">They will be locked out immediately. Provide a reason (optional).</p>
              <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} placeholder="Reason for suspension (optional)"
                className="w-full px-3 py-2 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none mb-4" />
              <div className="flex gap-2">
                <Button variant="danger" loading={acting===modal.id} onClick={()=>act(modal.id,modal.action)}>Confirm Suspend</Button>
                <Button variant="ghost" onClick={()=>setModal(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
