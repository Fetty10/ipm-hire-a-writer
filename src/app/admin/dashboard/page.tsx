export const dynamic = "force-dynamic";
"use client";
// src/app/admin/dashboard/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Spinner } from "@/components/ui";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const router = useRouter();
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/overview");
    const d   = await res.json();
    if (d.success) setData(d.data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function approveStaff(staffId: string, action: string) {
    const res  = await fetch("/api/admin/staff", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, action }),
    });
    const d = await res.json();
    if (res.ok) { toast.success(d.message); load(); }
    else toast.error(d.error);
  }

  async function payWithdrawal(withdrawalId: string) {
    const res  = await fetch("/api/withdrawals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, action: "approve" }),
    });
    const d = await res.json();
    if (res.ok) { toast.success(d.message); load(); }
    else toast.error(d.error);
  }

  const stats = data?.stats;
  const badges = {
    "/admin/staff/approvals": stats?.pendingApprovals || 0,
    "/admin/withdrawals":     stats?.pendingWithdrawals || 0,
  };

  const STAT_CARDS = stats ? [
    { icon:"📦", val:stats.activeOrders,      label:"Active Orders",      href:"/admin/orders?status=IN_PROGRESS", change: "" },
    { icon:"👥", val:stats.activeStaff,        label:"Active Staff",        href:"/admin/staff/list",                change: "" },
    { icon:"💰", val:`₦${(stats.revenueMonth||0).toLocaleString()}`, label:"Revenue (Month)", href:"/admin/orders", change:"" },
    { icon:"⏳", val:stats.pendingApprovals,   label:"Pending Approvals",   href:"/admin/staff/approvals",           change: "" },
    { icon:"💸", val:stats.pendingWithdrawals, label:"Withdrawals",         href:"/admin/withdrawals",               change: "" },
    { icon:"✅", val:stats.totalOrders,        label:"Total Orders",        href:"/admin/orders",                    change: "" },
    { icon:"📄", val:stats.deliveredToday,     label:"Delivered Today",     href:"/admin/orders",                    change: "" },
    { icon:"🔍", val:stats.qcReview,           label:"In QC Review",        href:"/admin/orders?status=QC_REVIEW",   change: "" },
  ] : [];

  return (
    <AdminLayout badges={badges}>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Admin Overview</h1>
        <p className="text-sm text-navy-muted mb-5">Platform health at a glance.</p>

        {/* Search bar */}
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-muted text-sm">🔍</span>
            <input placeholder="Search by topic, student name or phone number..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              onKeyDown={e => { if(e.key==="Enter") router.push(`/admin/orders?search=${(e.target as HTMLInputElement).value}`); }}
            />
          </div>
          <button onClick={() => router.push("/admin/orders")}
            className="px-4 py-2.5 rounded-xl bg-navy-DEFAULT text-sky-400 text-sm font-700">
            Search
          </button>
        </div>

        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {STAT_CARDS.map(s => (
                <div key={s.label} onClick={() => router.push(s.href)}
                  className="bg-white rounded-2xl border border-sky-100 shadow-card p-4 cursor-pointer hover:border-sky-400 hover:shadow-card-hover transition-all">
                  <div className="text-xl mb-2">{s.icon}</div>
                  <div className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight leading-none mb-1">{s.val}</div>
                  <div className="text-xs text-navy-muted">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Pending approvals */}
              <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-clash text-sm font-700 text-navy-DEFAULT">Pending Staff Approvals</h2>
                  <button onClick={() => router.push("/admin/staff/approvals")} className="text-xs text-sky-600 font-600 hover:underline">View all →</button>
                </div>
                {data.pendingStaff.length === 0 ? (
                  <p className="text-xs text-navy-muted text-center py-4">No pending approvals.</p>
                ) : data.pendingStaff.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 py-2.5 border-b border-sky-50 last:border-0">
                    <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 font-clash font-800 text-xs flex items-center justify-center flex-shrink-0">
                      {s.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-700 text-navy-DEFAULT truncate">{s.name}</p>
                      <p className="text-xs text-navy-muted">{s.role} · {s.phone}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => approveStaff(s.id, "approve")}
                        className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-700 hover:bg-green-100">✓</button>
                      <button onClick={() => approveStaff(s.id, "decline")}
                        className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-700 hover:bg-red-100">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending withdrawals */}
              <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-clash text-sm font-700 text-navy-DEFAULT">Pending Withdrawals</h2>
                  <button onClick={() => router.push("/admin/withdrawals")} className="text-xs text-sky-600 font-600 hover:underline">View all →</button>
                </div>
                {data.pendingWds.length === 0 ? (
                  <p className="text-xs text-navy-muted text-center py-4">No pending withdrawals.</p>
                ) : data.pendingWds.map((w: any) => (
                  <div key={w.id} className="flex items-center gap-3 py-2.5 border-b border-sky-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-700 text-navy-DEFAULT">{w.staffName} <span className="font-400 text-navy-muted text-xs">({w.staffRole})</span></p>
                      <p className="text-xs text-navy-muted">{w.bankName} · ₦{w.amountNaira.toLocaleString()}</p>
                    </div>
                    <button onClick={() => payWithdrawal(w.id)}
                      className="px-3 py-1.5 rounded-lg bg-sky-400 text-navy-DEFAULT text-xs font-700 hover:bg-sky-500 flex-shrink-0">
                      Pay →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent orders */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-clash text-sm font-700 text-navy-DEFAULT">Recent Orders</h2>
                <button onClick={() => router.push("/admin/orders")} className="text-xs text-sky-600 font-600 hover:underline">View all →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-sky-100">
                    {["Student","Phone","Topic","Level","Plan","Amount","Status"].map(h =>
                      <th key={h} className="text-left py-2 px-3 text-[.6rem] font-700 uppercase tracking-wider text-navy-muted">{h}</th>
                    )}
                  </tr></thead>
                  <tbody>
                    {data.recentOrders.map((o: any) => (
                      <tr key={o.id} className="border-b border-sky-50 hover:bg-sky-50/50 cursor-pointer" onClick={() => router.push(`/admin/orders`)}>
                        <td className="py-2.5 px-3 font-700">{o.studentName}</td>
                        <td className="py-2.5 px-3 text-navy-muted">{o.studentPhone}</td>
                        <td className="py-2.5 px-3 max-w-[140px] truncate">{o.topic}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{o.degreeGroup?.replace(/_/g,"/")||""}</td>
                        <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-[.65rem] font-700 bg-sky-100 text-sky-700">{o.planName}</span></td>
                        <td className="py-2.5 px-3 font-700 text-sky-600">₦{(o.amountPaid||0).toLocaleString()}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[.65rem] font-700 ${
                            o.status==="DELIVERED"?"bg-green-50 text-green-700":
                            o.status==="QC_REVIEW"?"bg-sky-100 text-sky-700":
                            o.status==="IN_PROGRESS"?"bg-yellow-50 text-yellow-700":
                            "bg-gray-100 text-gray-500"}`}>
                            {o.status?.replace(/_/g," ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
