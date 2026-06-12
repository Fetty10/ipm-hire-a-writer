"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const DEG_GROUPS  = ["OND_HND_NCE","BSC_BED_BA","PGD_MSC_PHD"];
const PLAN_NAMES  = ["BASIC","STANDARD","PROFESSIONAL","PHD_PROFESSIONAL"];
const PRICING_TYPES = ["FLAT","PER_CHAPTER"];
const DEG_LBL:Record<string,string>  = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};
const PLAN_LBL:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Professional"};

const C = {
  page:  { maxWidth:"1000px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden", marginBottom:"1.5rem" },
  thead: { background:"#F8FBFF" },
  table: { width:"100%", borderCollapse:"collapse" as const, fontSize:".78rem" },
  th:    { textAlign:"left" as const, padding:".6rem 1rem", fontSize:".6rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", borderBottom:"1px solid #E0F2FE", whiteSpace:"nowrap" as const },
  td:    { padding:".65rem 1rem", borderBottom:"1px solid #F0F9FF", color:"#0C1A2E", verticalAlign:"middle" as const },
  badge: { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700, background:"#E0F2FE", color:"#0369A1" },
  input: { width:"100px", padding:".35rem .6rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  btnS:  { padding:".35rem .75rem", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnR:  { padding:".35rem .75rem", borderRadius:"8px", background:"#FEE2E2", color:"#991B1B", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer" },
  addBox:{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"16px", padding:"1.25rem", marginBottom:"1.5rem" },
  addT:  { fontFamily:"'Syne',sans-serif", fontSize:".88rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1rem" },
  addRow:{ display:"flex", gap:".75rem", flexWrap:"wrap" as const, alignItems:"flex-end" },
  fg:    { display:"flex", flexDirection:"column" as const, gap:".3rem" },
  lbl:   { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6" },
  sel:   { padding:".35rem .6rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" },
  chk:   { width:"16px", height:"16px", cursor:"pointer" },
  btnA:  { padding:".55rem 1.25rem", borderRadius:"10px", background:"#0C1A2E", color:"#38BDF8", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
};

export default function AdminPlans() {
  const [plans,   setPlans]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string|null>(null);
  const [edits,   setEdits]   = useState<Record<string,string>>({});
  const [adding,  setAdding]  = useState(false);
  const [newPlan, setNewPlan] = useState({
    degreeGroup:"OND_HND_NCE", planName:"BASIC", pricingType:"FLAT",
    priceKobo:"", includesCorrections:false, includesPlagiarismCheck:false, includesFormat:false,
  });

  async function load() {
    const res  = await fetch("/api/admin/settings?type=plans");
    const data = await res.json();
    if (data.success) setPlans(data.data.plans);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(id: string) {
    if (!edits[id]) return;
    setSaving(id);
    const res  = await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type:"plan", id, priceKobo: Math.round(parseFloat(edits[id]) * 100) }),
    });
    const data = await res.json();
    if (res.ok) { alert("Plan updated!"); load(); } else alert(data.error);
    setSaving(null);
  }

  async function addPlan() {
    if (!newPlan.priceKobo) { alert("Enter a price."); return; }
    setAdding(true);
    const res  = await fetch("/api/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:                   "plan",
        degreeGroup:            newPlan.degreeGroup,
        planName:               newPlan.planName,
        pricingType:            newPlan.pricingType,
        priceKobo:              Math.round(parseFloat(newPlan.priceKobo) * 100),
        includesCorrections:    newPlan.includesCorrections,
        includesPlagiarismCheck:newPlan.includesPlagiarismCheck,
        includesFormat:         newPlan.includesFormat,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Plan added!");
      setNewPlan({degreeGroup:"OND_HND_NCE",planName:"BASIC",pricingType:"FLAT",priceKobo:"",includesCorrections:false,includesPlagiarismCheck:false,includesFormat:false});
      load();
    } else alert(data.error);
    setAdding(false);
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Plans & Pricing</h1>
        <p style={C.sub}>Update pricing for all service plans or add new ones.</p>

        {/* Add new plan */}
        <div style={C.addBox}>
          <div style={C.addT}>+ Add New Plan</div>
          <div style={C.addRow}>
            <div style={C.fg}>
              <label style={C.lbl}>Level</label>
              <select style={C.sel} value={newPlan.degreeGroup} onChange={e=>setNewPlan(p=>({...p,degreeGroup:e.target.value}))}>
                {DEG_GROUPS.map(d=><option key={d} value={d}>{DEG_LBL[d]}</option>)}
              </select>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Plan</label>
              <select style={C.sel} value={newPlan.planName} onChange={e=>setNewPlan(p=>({...p,planName:e.target.value}))}>
                {PLAN_NAMES.map(n=><option key={n} value={n}>{PLAN_LBL[n]}</option>)}
              </select>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Pricing Type</label>
              <select style={C.sel} value={newPlan.pricingType} onChange={e=>setNewPlan(p=>({...p,pricingType:e.target.value}))}>
                {PRICING_TYPES.map(t=><option key={t} value={t}>{t==="FLAT"?"Flat Rate":"Per Chapter"}</option>)}
              </select>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Price (₦)</label>
              <input style={C.input} type="number" placeholder="e.g. 12000" value={newPlan.priceKobo}
                onChange={e=>setNewPlan(p=>({...p,priceKobo:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Corrections</label>
              <input type="checkbox" style={C.chk} checked={newPlan.includesCorrections}
                onChange={e=>setNewPlan(p=>({...p,includesCorrections:e.target.checked}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Plagiarism</label>
              <input type="checkbox" style={C.chk} checked={newPlan.includesPlagiarismCheck}
                onChange={e=>setNewPlan(p=>({...p,includesPlagiarismCheck:e.target.checked}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Format</label>
              <input type="checkbox" style={C.chk} checked={newPlan.includesFormat}
                onChange={e=>setNewPlan(p=>({...p,includesFormat:e.target.checked}))} />
            </div>
            <button style={C.btnA} disabled={adding} onClick={addPlan}>
              {adding ? "Adding..." : "+ Add Plan"}
            </button>
          </div>
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <div style={C.card}>
            <div style={{overflowX:"auto"}}>
              <table style={C.table}>
                <thead style={C.thead}>
                  <tr>{["Level","Plan","Type","Price (₦)","Corrections","Plagiarism","Format","Active",""].map(h=><th key={h} style={C.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {plans.map((p:any) => (
                    <tr key={p.id}>
                      <td style={{...C.td,fontWeight:600,whiteSpace:"nowrap" as const}}>{DEG_LBL[p.degreeGroup]||p.degreeGroup}</td>
                      <td style={C.td}><span style={C.badge}>{PLAN_LBL[p.planName]||p.planName}</span></td>
                      <td style={{...C.td,color:"#5B7EA6"}}>{p.pricingType==="FLAT"?"Flat":"Per Ch"}</td>
                      <td style={C.td}>
                        <input style={C.input} type="number" defaultValue={p.priceKobo/100}
                          onChange={e=>setEdits(prev=>({...prev,[p.id]:e.target.value}))} />
                      </td>
                      <td style={{...C.td,textAlign:"center" as const}}>{p.includesCorrections?"✅":"—"}</td>
                      <td style={{...C.td,textAlign:"center" as const}}>{p.includesPlagiarismCheck?"✅":"—"}</td>
                      <td style={{...C.td,textAlign:"center" as const}}>{p.includesFormat?"✅":"—"}</td>
                      <td style={C.td}>
                        <span style={{...C.badge,...(p.isActive?{background:"#D1FAE5",color:"#065F46"}:{background:"#F1F5F9",color:"#64748B"})}}>
                          {p.isActive?"Active":"Off"}
                        </span>
                      </td>
                      <td style={C.td}>
                        <button style={C.btnS} disabled={saving===p.id} onClick={()=>save(p.id)}>
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
