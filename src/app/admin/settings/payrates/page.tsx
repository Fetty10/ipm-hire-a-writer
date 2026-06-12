"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const ROLES       = ["WRITER","ANALYST","QC"];
const DEG_GROUPS  = ["OND_HND_NCE","BSC_BED_BA","PGD_MSC_PHD"];
const PLAN_NAMES  = ["BASIC","STANDARD","PROFESSIONAL","PHD_PROFESSIONAL"];
const DEG_LBL:Record<string,string>  = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};
const PLAN_LBL:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Pro"};

const C = {
  page:  { maxWidth:"900px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden", marginBottom:"1.5rem" },
  thead: { background:"#F8FBFF" },
  table: { width:"100%", borderCollapse:"collapse" as const, fontSize:".78rem" },
  th:    { textAlign:"left" as const, padding:".6rem 1rem", fontSize:".6rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", borderBottom:"1px solid #E0F2FE", whiteSpace:"nowrap" as const },
  td:    { padding:".65rem 1rem", borderBottom:"1px solid #F0F9FF", color:"#0C1A2E", verticalAlign:"middle" as const },
  badge: { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700, background:"#E0F2FE", color:"#0369A1" },
  input: { width:"96px", padding:".35rem .6rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  sel:   { padding:".35rem .6rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" },
  btnS:  { padding:".35rem .75rem", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnR:  { padding:".35rem .75rem", borderRadius:"8px", background:"#FEE2E2", color:"#991B1B", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer" },
  addBox:{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"16px", padding:"1.25rem", marginBottom:"1.5rem" },
  addT:  { fontFamily:"'Syne',sans-serif", fontSize:".88rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1rem" },
  addRow:{ display:"flex", gap:".75rem", flexWrap:"wrap" as const, alignItems:"flex-end" },
  fg:    { display:"flex", flexDirection:"column" as const, gap:".3rem" },
  lbl:   { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6" },
  btnA:  { padding:".55rem 1.25rem", borderRadius:"10px", background:"#0C1A2E", color:"#38BDF8", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};

export default function AdminPayRates() {
  const [rates,   setRates]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string|null>(null);
  const [edits,   setEdits]   = useState<Record<string,string>>({});
  const [adding,  setAdding]  = useState(false);
  const [newRate, setNewRate] = useState({ role:"WRITER", degreeGroup:"OND_HND_NCE", planName:"STANDARD", amountKobo:"" });

  async function load() {
    const res  = await fetch("/api/admin/settings?type=payrates");
    const data = await res.json();
    if (data.success) setRates(data.data.payRates);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(id: string) {
    if (!edits[id]) return;
    setSaving(id);
    const res  = await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type:"payrate", id, amountKobo: Math.round(parseFloat(edits[id]) * 100) }),
    });
    const data = await res.json();
    if (res.ok) { alert("Pay rate updated!"); load(); } else alert(data.error);
    setSaving(null);
  }

  async function deleteRate(id: string) {
    if (!confirm("Delete this pay rate?")) return;
    setSaving("del"+id);
    const res  = await fetch("/api/admin/settings", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type:"payrate", id }),
    });
    const data = await res.json();
    if (res.ok) { load(); } else alert(data.error);
    setSaving(null);
  }

  async function addRate() {
    if (!newRate.amountKobo) { alert("Enter an amount."); return; }
    setAdding(true);
    const res  = await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:        "payrate",
        role:        newRate.role,
        degreeGroup: newRate.degreeGroup,
        planName:    newRate.planName,
        amountKobo:  Math.round(parseFloat(newRate.amountKobo) * 100),
      }),
    });
    const data = await res.json();
    if (res.ok) { alert("Pay rate added!"); setNewRate({role:"WRITER",degreeGroup:"OND_HND_NCE",planName:"STANDARD",amountKobo:""}); load(); }
    else alert(data.error);
    setAdding(false);
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Pay Rates</h1>
        <p style={C.sub}>Control what each role earns per chapter per plan.</p>

        {/* Add new pay rate */}
        <div style={C.addBox}>
          <div style={C.addT}>+ Add New Pay Rate</div>
          <div style={C.addRow}>
            <div style={C.fg}>
              <label style={C.lbl}>Role</label>
              <select style={C.sel} value={newRate.role} onChange={e=>setNewRate(p=>({...p,role:e.target.value}))}>
                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Level</label>
              <select style={C.sel} value={newRate.degreeGroup} onChange={e=>setNewRate(p=>({...p,degreeGroup:e.target.value}))}>
                {DEG_GROUPS.map(d=><option key={d} value={d}>{DEG_LBL[d]}</option>)}
              </select>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Plan</label>
              <select style={C.sel} value={newRate.planName} onChange={e=>setNewRate(p=>({...p,planName:e.target.value}))}>
                {PLAN_NAMES.map(p=><option key={p} value={p}>{PLAN_LBL[p]}</option>)}
              </select>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Amount (₦)</label>
              <input style={C.input} type="number" placeholder="e.g. 1000" value={newRate.amountKobo}
                onChange={e=>setNewRate(p=>({...p,amountKobo:e.target.value}))} />
            </div>
            <button style={C.btnA} disabled={adding} onClick={addRate}>
              {adding ? "Adding..." : "+ Add Rate"}
            </button>
          </div>
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <div style={C.card}>
            <div style={{overflowX:"auto"}}>
              <table style={C.table}>
                <thead style={C.thead}>
                  <tr>{["Role","Level","Plan","Amount (₦)","",""].map(h=><th key={h} style={C.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rates.map((r:any) => (
                    <tr key={r.id}>
                      <td style={C.td}><span style={C.badge}>{r.role}</span></td>
                      <td style={{...C.td,color:"#5B7EA6",whiteSpace:"nowrap" as const}}>{DEG_LBL[r.degreeGroup]||r.degreeGroup}</td>
                      <td style={{...C.td,color:"#5B7EA6"}}>{PLAN_LBL[r.planName]||r.planName}</td>
                      <td style={C.td}>
                        <input style={C.input} type="number" defaultValue={r.amountKobo/100}
                          onChange={e=>setEdits(prev=>({...prev,[r.id]:e.target.value}))} />
                      </td>
                      <td style={C.td}>
                        <button style={C.btnS} disabled={saving===r.id} onClick={()=>save(r.id)}>
                          {saving===r.id?"...":"Save"}
                        </button>
                      </td>
                      <td style={C.td}>
                        <button style={C.btnR} disabled={saving==="del"+r.id} onClick={()=>deleteRate(r.id)}>
                          {saving==="del"+r.id?"...":"✕"}
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
