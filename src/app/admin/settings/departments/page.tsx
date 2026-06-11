"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:".75rem" },
  notice:{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1.5rem", fontSize:".78rem", color:"#0369A1" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem", marginBottom:"1rem" },
  wrap:  { display:"flex", flexWrap:"wrap" as const, gap:".5rem", minHeight:"48px" },
  dchip: { display:"inline-flex", alignItems:"center", gap:".4rem", padding:".4rem 1rem", borderRadius:"999px", background:"#E0F2FE", border:"1px solid #BAE6FD", fontSize:".78rem", fontWeight:700, color:"#0C1A2E" },
  xbtn:  { background:"none", border:"none", cursor:"pointer", color:"#EF4444", fontSize:"1rem", lineHeight:1, padding:0 },
  empty: { color:"#5B7EA6", fontSize:".82rem" },
  adRow: { display:"flex", gap:".75rem" },
  input: { flex:1, padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  btnP:  { padding:".65rem 1.25rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", flexShrink:0 as const },
};

export default function AdminDepartments() {
  const [depts,   setDepts]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDept, setNewDept] = useState("");
  const [adding,  setAdding]  = useState(false);

  async function load() {
    const res  = await fetch("/api/admin/settings?type=departments");
    const data = await res.json();
    if(data.success) setDepts(data.data.departments);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function add() {
    if(!newDept.trim()) return;
    setAdding(true);
    const res  = await fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newDept.trim()})});
    const data = await res.json();
    if(res.ok){ setNewDept(""); load(); } else alert(data.error);
    setAdding(false);
  }

  async function remove(id:string) {
    const res = await fetch("/api/admin/settings",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    if(res.ok) setDepts(prev=>prev.filter(d=>d.id!==id));
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Exception Departments</h1>
        <p style={C.sub}>Departments where all chapters go to Writers only — no Analyst split.</p>
        <div style={C.notice}>ℹ For these departments, the writer handles all 5 chapters regardless of the normal Writer/Analyst split.</div>

        <div style={C.card}>
          {loading ? <div style={{color:"#5B7EA6",fontSize:".82rem"}}>Loading...</div> : (
            <div style={C.wrap}>
              {depts.length===0
                ? <span style={C.empty}>No exception departments yet.</span>
                : depts.map((d:any)=>(
                  <span key={d.id} style={C.dchip}>
                    {d.name}
                    <button style={C.xbtn} onClick={()=>remove(d.id)}>×</button>
                  </span>
                ))}
            </div>
          )}
        </div>

        <div style={C.card}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:".85rem",fontWeight:700,color:"#0C1A2E",marginBottom:"1rem"}}>Add Department</div>
          <div style={C.adRow}>
            <input style={C.input} value={newDept} onChange={e=>setNewDept(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&add()} placeholder="e.g. Anatomy" />
            <button style={C.btnP} disabled={adding} onClick={add}>{adding?"Adding...":"+ Add"}</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
