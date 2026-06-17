"use client";
// src/app/admin/settings/departments/page.tsx
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";

export default function AdminDepartments() {
  const [depts,    setDepts]    = useState<any[]>([]);
  const [qcStaff,  setQcStaff]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [newDept,  setNewDept]  = useState("");
  const [newQcId,  setNewQcId]  = useState("");
  const [adding,   setAdding]   = useState(false);
  const [newFootnotePay, setNewFootnotePay] = useState("");

  async function load() {
    const [dRes, qRes] = await Promise.all([
      fetch("/api/admin/settings?type=departments").then(r => r.json()),
      fetch("/api/admin/staff?filter=approved&role=QC").then(r => r.json()),
    ]);
    if (dRes.success) setDepts(dRes.data.departments);
    if (qRes.success) setQcStaff(qRes.data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!newDept.trim()) return;
    setAdding(true);
    const res  = await fetch("/api/admin/settings", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name: newDept.trim(), dedicatedQcId: newQcId || null, footnotePayKobo: parseFloat(newFootnotePay) ? Math.round(parseFloat(newFootnotePay) * 100) : 0 }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Course added."); setNewDept(""); setNewQcId(""); setNewFootnotePay(""); load(); }
    else toast.error(data.error);
    setAdding(false);
  }

  async function remove(id: string) {
    const res = await fetch("/api/admin/settings", {
      method:"DELETE", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id }),
    });
    if (res.ok) { toast.success("Course removed."); setDepts(prev => prev.filter(d => d.id !== id)); }
  }

  async function updateQc(id: string, dedicatedQcId: string) {
    const res = await fetch("/api/admin/settings", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ type:"department", id, dedicatedQcId: dedicatedQcId || null }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Updated."); load(); }
    else toast.error(data.error);
  }

  const qcName = (id: string) => qcStaff.find(q => q.id === id)?.name || "—";

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Exception Courses</h1>
        <p className="text-sm text-navy-muted mb-2">
          Courses where all chapters go to the Writer only — no Analyst split. You can also assign a dedicated QC staff for specific courses.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-800 leading-relaxed">
          <strong>How matching works:</strong> Adding <strong>"Law"</strong> matches "Faculty of Law", "law department" etc. For <strong>Dedicated QC</strong> — if set, all Professional plan projects from this course will go to that specific QC staff instead of the general queue.
        </div>

        {loading ? <div className="text-center py-8 text-navy-muted">Loading...</div> : (
          <>
            {/* Existing courses */}
            {depts.length > 0 && (
              <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5 mb-4">
                <p className="text-xs font-700 text-navy-muted uppercase tracking-wider mb-3">
                  {depts.length} Exception Course{depts.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-col gap-3">
                  {depts.map(d => (
                    <div key={d.id} className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
                      <div className="flex-1">
                        <div className="text-sm font-700 text-navy-DEFAULT">{d.name}</div>
                        {d.dedicatedQcId && (
                          <div className="text-xs text-sky-600 mt-0.5">🔒 Dedicated QC: {qcName(d.dedicatedQcId)}</div>
                        )}
                        {d.footnotePayKobo > 0 && (
                          <div className="text-xs text-purple-600 mt-0.5">📝 Footnote Pay: ₦{(d.footnotePayKobo/100).toLocaleString()} per chapter</div>
                        )}
                      </div>
                      <select
                        className="text-xs border border-sky-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
                        value={d.dedicatedQcId || ""}
                        onChange={e => updateQc(d.id, e.target.value)}>
                        <option value="">No dedicated QC</option>
                        {qcStaff.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                      </select>
                      <button onClick={() => remove(d.id)}
                        className="text-red-400 hover:text-red-600 text-sm font-700 w-6 h-6 flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new */}
            <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5">
              <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-1">Add Exception Course</h2>
              <p className="text-xs text-navy-muted mb-3">
                e.g. <em>Law</em>, <em>Medicine</em>, <em>Pharmacy</em>, <em>Architecture</em>
              </p>
              <div className="flex flex-col gap-3">
                <input value={newDept} onChange={e => setNewDept(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && add()}
                  placeholder="e.g. Law"
                  className="w-full px-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                <div>
                  <label className="text-xs font-700 text-navy-muted uppercase tracking-wider block mb-1.5">
                    Dedicated QC Staff <span className="font-400 normal-case">(optional)</span>
                  </label>
                  <select value={newQcId} onChange={e => setNewQcId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
                    <option value="">No dedicated QC</option>
                    {qcStaff.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-700 text-navy-muted uppercase tracking-wider block mb-1.5">
                    Footnote Pay per Chapter (₦) <span className="font-400 normal-case">(optional — paid in addition to QC rate)</span>
                  </label>
                  <input type="number" min="0" value={newFootnotePay} onChange={e => setNewFootnotePay(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>
                <button disabled={adding} onClick={add}
                  className="w-full py-2.5 rounded-xl bg-navy-DEFAULT text-sky-400 font-700 text-sm">
                  {adding ? "Adding..." : "+ Add Course"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
