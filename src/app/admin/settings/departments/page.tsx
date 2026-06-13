"use client";
// src/app/admin/settings/departments/page.tsx
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Spinner, Button } from "@/components/ui";
import toast from "react-hot-toast";

export default function AdminDepartments() {
  const [depts,   setDepts]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDept, setNewDept] = useState("");
  const [adding,  setAdding]  = useState(false);

  async function load() {
    const res  = await fetch("/api/admin/settings?type=departments");
    const data = await res.json();
    if (data.success) setDepts(data.data.departments);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!newDept.trim()) return;
    setAdding(true);
    const res  = await fetch("/api/admin/settings", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name: newDept.trim() }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Course added."); setNewDept(""); load(); }
    else toast.error(data.error);
    setAdding(false);
  }

  async function remove(id: string) {
    const res  = await fetch("/api/admin/settings", {
      method:"DELETE", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id }),
    });
    if (res.ok) { toast.success("Course removed."); setDepts(prev=>prev.filter(d=>d.id!==id)); }
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Exception Courses</h1>
        <p className="text-sm text-navy-muted mb-2">
          Courses where all chapters are handled by the Writer only — no Analyst split.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-800 leading-relaxed">
          <strong>How matching works:</strong> If a student types "Faculty of Law" or "law" or "Common Law", 
          it will still match if you have added <strong>"Law"</strong> here. You don't need an exact match — 
          just add the key course name/keyword.
        </div>

        {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div> : (
          <>
            <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5 mb-4">
              <p className="text-xs font-700 text-navy-muted uppercase tracking-wider mb-3">
                {depts.length} Exception Course{depts.length !== 1 ? "s" : ""} Added
              </p>
              <div className="flex flex-wrap gap-2">
                {depts.map(d => (
                  <span key={d.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-100 border border-sky-200 text-xs font-700 text-sky-800">
                    {d.name}
                    <button onClick={() => remove(d.id)} className="text-red-500 hover:text-red-700 ml-0.5 text-sm leading-none">×</button>
                  </span>
                ))}
                {depts.length === 0 && <p className="text-sm text-navy-muted">No exception courses yet.</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5">
              <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-1">Add Exception Course</h2>
              <p className="text-xs text-navy-muted mb-3">
                e.g. <em>Law</em>, <em>Medicine</em>, <em>Pharmacy</em>, <em>Architecture</em>
              </p>
              <div className="flex gap-2">
                <input value={newDept} onChange={e=>setNewDept(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && add()}
                  placeholder="e.g. Law"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                <Button variant="primary" loading={adding} onClick={add}>+ Add</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
