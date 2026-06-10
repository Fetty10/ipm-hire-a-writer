export const dynamic = "force-dynamic";
"use client";
// src/app/admin/settings/payrates/page.tsx
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Spinner } from "@/components/ui";
import toast from "react-hot-toast";

const ROLE_LABELS: Record<string,string> = {WRITER:"Writer",ANALYST:"Analyst",QC:"Quality Control"};
const DEG_LABELS: Record<string,string>  = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};
const PLAN_LABELS: Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Pro"};

export default function AdminPayRates() {
  const [rates,   setRates]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string|null>(null);
  const [edits,   setEdits]   = useState<Record<string,string>>({});

  useEffect(() => {
    fetch("/api/admin/settings?type=payrates").then(r=>r.json()).then(d=>{ if(d.success) setRates(d.data.payRates); setLoading(false); });
  }, []);

  async function save(id: string) {
    if (!edits[id]) return;
    setSaving(id);
    const res  = await fetch("/api/admin/settings", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ type:"payrate", id, amountKobo: Math.round(parseFloat(edits[id]) * 100) }),
    });
    const data = await res.json();
    if (res.ok) toast.success("Pay rate updated.");
    else toast.error(data.error);
    setSaving(null);
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Pay Rates</h1>
        <p className="text-sm text-navy-muted mb-5">Control what each role earns per chapter per service and plan.</p>
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div> : (
          <div className="bg-white rounded-2xl border border-sky-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-sky-100 bg-sky-50/50">
                  {["Role","Level","Plan","Chapter","Amount (₦)",""].map(h=><th key={h} className="text-left py-3 px-4 text-[.6rem] font-700 uppercase tracking-wider text-navy-muted">{h}</th>)}
                </tr></thead>
                <tbody>
                  {rates.map((r: any) => (
                    <tr key={r.id} className="border-b border-sky-50 hover:bg-sky-50/30">
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[.65rem] font-700 bg-sky-100 text-sky-700">{ROLE_LABELS[r.role]||r.role}</span></td>
                      <td className="py-3 px-4 text-navy-muted">{DEG_LABELS[r.degreeGroup]||r.degreeGroup}</td>
                      <td className="py-3 px-4 text-navy-muted">{PLAN_LABELS[r.planName]||r.planName}</td>
                      <td className="py-3 px-4 text-navy-muted">{r.chapterNumber ?? "All"}</td>
                      <td className="py-3 px-4">
                        <input type="number"
                          defaultValue={r.amountKobo/100}
                          onChange={e => setEdits(prev => ({...prev, [r.id]: e.target.value}))}
                          className="w-24 px-2 py-1 rounded-lg border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => save(r.id)} disabled={saving===r.id}
                          className="px-3 py-1 rounded-lg bg-sky-400 text-navy-DEFAULT text-xs font-700 hover:bg-sky-500 disabled:opacity-50">
                          {saving===r.id?"...":"Save"}
                        </button>
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
