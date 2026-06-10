"use client";
export const dynamic = "force-dynamic";
// src/app/admin/orders/page.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Spinner } from "@/components/ui";

const STATUSES = ["all","IN_PROGRESS","QC_REVIEW","DELIVERED","PENDING_PAYMENT","CANCELLED"];

export default function AdminOrders() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState(searchParams.get("search")||"");
  const [status,  setStatus]  = useState(searchParams.get("status")||"all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res  = await fetch(`/api/admin/orders?status=${status}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) { setOrders(data.data.orders); setTotal(data.data.total); }
      setLoading(false);
    }
    load();
  }, [status, search]);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">All Orders</h1>
        <p className="text-sm text-navy-muted mb-5">Complete order list with full management controls.</p>

        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-muted text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by topic, student name or phone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
            {STATUSES.map(s => <option key={s} value={s}>{s === "all" ? "All Statuses" : s.replace(/_/g," ")}</option>)}
          </select>
        </div>

        <p className="text-xs text-navy-muted mb-3">{total} orders found</p>

        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
          <div className="bg-white rounded-2xl border border-sky-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-sky-100 bg-sky-50/50">
                  {["#","Student","Phone","Topic","Level","Plan","Amount","Status","Chapters"].map(h =>
                    <th key={h} className="text-left py-3 px-4 text-[.6rem] font-700 uppercase tracking-wider text-navy-muted whitespace-nowrap">{h}</th>
                  )}
                </tr></thead>
                <tbody>
                  {orders.map((o: any) => (
                    <tr key={o.id} className="border-b border-sky-50 hover:bg-sky-50/30">
                      <td className="py-3 px-4 text-navy-muted font-600">{o.id.slice(-6).toUpperCase()}</td>
                      <td className="py-3 px-4 font-700 whitespace-nowrap">{o.student?.name}</td>
                      <td className="py-3 px-4 text-navy-muted whitespace-nowrap">{o.student?.phone}</td>
                      <td className="py-3 px-4 max-w-[160px] truncate">{o.topic}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-navy-muted">{o.degreeGroup?.replace(/_/g,"/")}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[.65rem] font-700 bg-sky-100 text-sky-700 whitespace-nowrap">{o.planName}</span></td>
                      <td className="py-3 px-4 font-700 text-sky-600 whitespace-nowrap">₦{(o.amountPaid||0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[.65rem] font-700 whitespace-nowrap ${
                          o.status==="DELIVERED"?"bg-green-50 text-green-700":
                          o.status==="QC_REVIEW"?"bg-sky-100 text-sky-700":
                          o.status==="IN_PROGRESS"?"bg-yellow-50 text-yellow-700":"bg-gray-100 text-gray-500"}`}>
                          {o.status?.replace(/_/g," ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-navy-muted whitespace-nowrap">
                        {o.chapters?.filter((c:any)=>c.status==="DELIVERED").length}/{o.chapters?.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
