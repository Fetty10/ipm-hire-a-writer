"use client";
// src/app/admin/settings/plans/page.tsx
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Spinner } from "@/components/ui";
import toast from "react-hot-toast";

const DEG_LABELS: Record<string,string>  = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};
const PLAN_LABELS: Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Professional"};

export default function AdminPlans() {
  const [plans,   setPlans]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string|null>(null);
  const [edits,   setEdits]   = useState<Record<string,string>>({});

  useEffect(() => {
    fetch("/api/admin/settings?type=plans").then(r=>r.json()).then(d=>{ if(d.success) setPlans(d.data.plans); setLoading(false); });
  }, []);

  async function save(id: string) {
    if (!edits[id]) return;
    setSaving(id);
    const res  = await fetch("/api/admin/settings", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ type:"plan", id, priceKobo: Math.round(parseFloat(edits[id]) * 100) }),
    });
    const data = await res.json();
    if (res.ok) toast.success("Plan price updated.");
    else toast.error(data.error);
    setSaving(null);
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Plans & Pricing</h1>
        <p className="text-sm text-navy-muted mb-5">Update pricing for all service plans. Changes apply immediately.</p>
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div> : (
          <div className="bg-white rounded-2xl border border-sky-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-sky-100 bg-sky-50/50">
                  {["Level","Plan","Type","Price (₦)","Includes","Active",""].map(h=><th key={h} className="text-left py-3 px-4 text-[.6rem] font-700 uppercase tracking-wider text-navy-muted">{h}</th>)}
                </tr></thead>
                <tbody>
                  {plans.map((p: any) => (
                    <tr key={p.id} className="border-b border-sky-50 hover:bg-sky-50/30">
                      <td className="py-3 px-4 font-600">{DEG_LABELS[p.degreeGroup]||p.degreeGroup}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full text-[.65rem] font-700 bg-sky-100 text-sky-700">{PLAN_LABELS[p.planName]||p.planName}</span></td>
                      <td className="py-3 px-4 text-navy-muted">{p.pricingType==="FLAT"?"Flat":"Per Chapter"}</td>
                      <td className="py-3 px-4">
                        <input type="number" defaultValue={p.priceKobo/100}
                          onChange={e => setEdits(prev => ({...prev, [p.id]: e.target.value}))}
                          className="w-24 px-2 py-1 rounded-lg border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                      </td>
                      <td className="py-3 px-4 text-navy-muted">
                        {[p.includesCorrections&&"Corrections",p.includesPlagiarismCheck&&"Plagiarism",p.includesFormat&&"Format"].filter(Boolean).join(", ")||"—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[.65rem] font-700 ${p.isActive?"bg-green-50 text-green-700":"bg-gray-100 text-gray-500"}`}>
                          {p.isActive?"Active":"Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => save(p.id)} disabled={saving===p.id}
                          className="px-3 py-1 rounded-lg bg-sky-400 text-navy-DEFAULT text-xs font-700 hover:bg-sky-500 disabled:opacity-50">
                          {saving===p.id?"...":"Save"}
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
