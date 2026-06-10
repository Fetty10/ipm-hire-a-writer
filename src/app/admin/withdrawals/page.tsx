"use client";
// src/app/admin/withdrawals/page.tsx
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Spinner } from "@/components/ui";
import toast from "react-hot-toast";

export default function AdminWithdrawals() {
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState<string|null>(null);
  const [tab,     setTab]     = useState<"pending"|"history">("pending");

  async function load() {
    const [pRes, hRes] = await Promise.all([
      fetch("/api/admin/overview"),
      fetch("/api/admin/orders"), // reuse for now
    ]);
    const pData = await pRes.json();
    if (pData.success) setPending(pData.data.pendingWds || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleAction(withdrawalId: string, action: string) {
    setActing(withdrawalId);
    const res  = await fetch("/api/withdrawals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, action }),
    });
    const data = await res.json();
    if (res.ok) { toast.success(data.message); setPending(prev => prev.filter(w => w.id !== withdrawalId)); }
    else toast.error(data.error);
    setActing(null);
  }

  return (
    <AdminLayout badges={{ "/admin/withdrawals": pending.length }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Withdrawal Requests</h1>
        <p className="text-sm text-navy-muted mb-5">Approve → Paystack auto-transfers instantly to staff bank account.</p>

        {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div> : (
          <>
            {pending.length === 0 ? (
              <div className="text-center py-16"><div className="text-4xl mb-3">✅</div><p className="text-navy-muted font-600">No pending withdrawals.</p></div>
            ) : (
              <div className="flex flex-col gap-4">
                {pending.map((w: any) => (
                  <div key={w.id} className="bg-white rounded-2xl border border-sky-100 shadow-card p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="text-base font-700 text-navy-DEFAULT">{w.staffName} <span className="text-xs font-400 text-navy-muted">({w.staffRole})</span></p>
                        <p className="text-xs text-navy-muted mt-1">{w.bankName} · {w.accountNumber} · {w.accountName}</p>
                        <p className="text-xs text-navy-muted">Requested: {new Date(w.requestedAt).toLocaleDateString("en-NG")}</p>
                      </div>
                      <div className="font-clash text-2xl font-800 text-sky-600 flex-shrink-0">
                        ₦{(w.amountNaira||0).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => handleAction(w.id, "approve")} disabled={acting===w.id}
                        className="px-4 py-2 rounded-xl bg-sky-400 text-navy-DEFAULT text-sm font-700 hover:bg-sky-500 disabled:opacity-50 transition-all">
                        {acting===w.id ? "Processing..." : "✓ Approve & Pay via Paystack"}
                      </button>
                      <button onClick={() => handleAction(w.id, "decline")} disabled={acting===w.id}
                        className="px-4 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-700 hover:bg-red-100 disabled:opacity-50 transition-all">
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
