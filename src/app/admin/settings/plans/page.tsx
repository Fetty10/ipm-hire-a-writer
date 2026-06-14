"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const DEG_GROUPS  = ["OND_HND_NCE","BSC_BED_BA","PGD_MSC_PHD","PHD"];
const PLAN_NAMES  = ["BASIC","STANDARD","PROFESSIONAL","PHD_PROFESSIONAL"];
const PRICING_TYPES = ["FLAT","PER_CHAPTER"];
const DEG_LBL:Record<string,string>  = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc",PHD:"PhD"};
const PLAN_LBL:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Professional"};

const C = {
  page:   { maxWidth:"1100px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:    { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  addBox: { background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:"16px", padding:"1.25rem", marginBottom:"1.5rem" },
  addT:   { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1rem" },
  grid:   { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:".75rem", marginBottom:"1rem" },
  fg:     { display:"flex", flexDirection:"column" as const, gap:".3rem" },
  lbl:    { fontSize:".62rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6" },
  sel:    { padding:".5rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" },
  inp:    { padding:".5rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" as const },
  chkRow: { display:"flex", gap:"1rem", flexWrap:"wrap" as const, marginBottom:"1rem" },
  chkItem:{ display:"flex", alignItems:"center", gap:".4rem", fontSize:".82rem", color:"#0C1A2E", cursor:"pointer" },
  btnA:   { padding:".55rem 1.5rem", borderRadius:"10px", background:"#0C1A2E", color:"#38BDF8", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer" },
  // Table
  card:   { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden" },
  table:  { width:"100%", borderCollapse:"collapse" as const, fontSize:".78rem" },
  thead:  { background:"#F8FBFF" },
  th:     { textAlign:"left" as const, padding:".65rem 1rem", fontSize:".6rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", borderBottom:"1px solid #E0F2FE", whiteSpace:"nowrap" as const },
  td:     { padding:".6rem .9rem", borderBottom:"1px solid #F0F9FF", verticalAlign:"middle" as const },
  tdInp:  { padding:".4rem .6rem", borderRadius:"7px", border:"1.5px solid #BAE6FD", fontSize:".8rem", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"90px" },
  tdSel:  { padding:".4rem .6rem", borderRadius:"7px", border:"1.5px solid #BAE6FD", fontSize:".8rem", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff" },
  badge:  { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700 },
  bGreen: { background:"#D1FAE5", color:"#065F46" },
  bGrey:  { background:"#F1F5F9", color:"#64748B" },
  bBlue:  { background:"#E0F2FE", color:"#0369A1" },
  btnS:   { padding:".3rem .7rem", borderRadius:"7px", background:"#38BDF8", color:"#0C1A2E", fontSize:".7rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnR:   { padding:".3rem .7rem", borderRadius:"7px", background:"#FEE2E2", color:"#991B1B", fontSize:".7rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnT:   { padding:".3rem .7rem", borderRadius:"7px", background:"#F1F5F9", color:"#64748B", fontSize:".7rem", fontWeight:700, border:"none", cursor:"pointer" },
  acts:   { display:"flex", gap:".35rem", flexWrap:"wrap" as const },
};

const BLANK = { degreeGroup:"OND_HND_NCE", planName:"BASIC", pricingType:"FLAT", priceKobo:"", priceGHS:"", priceKES:"", priceUSD:"", priceGBP:"", includesCorrections:false, includesPlagiarismCheck:false, includesFormat:false };

export default function AdminPlans() {
  const [plans,   setPlans]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string|null>(null);
  const [adding,  setAdding]  = useState(false);
  const [newPlan, setNewPlan] = useState({...BLANK});
  // Per-row edits
  const [edits,   setEdits]   = useState<Record<string,any>>({});

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/admin/settings?type=plans");
    const data = await res.json();
    if (data.success) {
      setPlans(data.data.plans);
      // Init edits with current values
      const init:any = {};
      data.data.plans.forEach((p:any) => {
        init[p.id] = {
          priceKobo:               p.priceKobo/100,
          pricingType:             p.pricingType,
          priceGHS:                (p as any).priceGHS ? (p as any).priceGHS/100 : "",
          priceKES:                (p as any).priceKES ? (p as any).priceKES/100 : "",
          priceUSD:                (p as any).priceUSD ? (p as any).priceUSD/100 : "",
          priceGBP:                (p as any).priceGBP ? (p as any).priceGBP/100 : "",
          includesCorrections:     p.includesCorrections,
          includesPlagiarismCheck: p.includesPlagiarismCheck,
          includesFormat:          p.includesFormat,
          isActive:                p.isActive,
        };
      });
      setEdits(init);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function updEdit(id:string, field:string, val:any) {
    setEdits(prev => ({...prev,[id]:{...prev[id],[field]:val}}));
  }

  async function savePlan(id:string) {
    const e = edits[id];
    if (!e) return;
    setSaving(id);
    const res  = await fetch("/api/admin/settings", {
      method: "PATCH", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        type:                   "plan",
        id,
        priceKobo:              Math.round(parseFloat(e.priceKobo) * 100),
        pricingType:            e.pricingType,
        priceGHS:               e.priceGHS !== undefined ? (e.priceGHS ? Math.round(parseFloat(e.priceGHS)*100) : null) : undefined,
        priceKES:               e.priceKES !== undefined ? (e.priceKES ? Math.round(parseFloat(e.priceKES)*100) : null) : undefined,
        priceUSD:               e.priceUSD !== undefined ? (e.priceUSD ? Math.round(parseFloat(e.priceUSD)*100) : null) : undefined,
        priceGBP:               e.priceGBP !== undefined ? (e.priceGBP ? Math.round(parseFloat(e.priceGBP)*100) : null) : undefined,
        includesCorrections:    e.includesCorrections,
        includesPlagiarismCheck:e.includesPlagiarismCheck,
        includesFormat:         e.includesFormat,
        isActive:               e.isActive,
      }),
    });
    const data = await res.json();
    if (res.ok) { await load(); }
    else toast.error(data.error || "Something went wrong");
    setSaving(null);
  }

  async function deletePlan(id:string, label:string) {
    let confirmed = false; await new Promise<void>(resolve => { toast((t) => (<span style={{display:"flex",alignItems:"center",gap:"1rem",fontSize:".82rem"}}><span>Delete this plan? Existing orders unaffected.</span><button style={{background:"#FEE2E2",color:"#991B1B",border:"none",padding:"4px 10px",borderRadius:"6px",cursor:"pointer",fontWeight:700}} onClick={()=>{confirmed=true;toast.dismiss(t.id);resolve();}}>Delete</button><button style={{background:"#F1F5F9",border:"none",padding:"4px 10px",borderRadius:"6px",cursor:"pointer"}} onClick={()=>{toast.dismiss(t.id);resolve();}}>Cancel</button></span>), {duration:10000}); }); if (!confirmed) return;
    setSaving("del"+id);
    const res  = await fetch("/api/admin/settings", {
      method:"DELETE", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ type:"plan", id }),
    });
    const data = await res.json();
    if (res.ok) { await load(); }
    else toast.error(data.error || "Something went wrong");
    setSaving(null);
  }

  async function addPlan() {
    if (!newPlan.priceKobo) { toast.error("Enter a price."); return; }
    setAdding(true);
    const res  = await fetch("/api/admin/settings", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        type:                   "plan",
        degreeGroup:            newPlan.degreeGroup,
        planName:               newPlan.planName,
        pricingType:            newPlan.pricingType,
        priceKobo:              Math.round(parseFloat(newPlan.priceKobo) * 100),
        priceGHS:               newPlan.priceGHS ? Math.round(parseFloat(newPlan.priceGHS) * 100) : null,
        priceKES:               newPlan.priceKES ? Math.round(parseFloat(newPlan.priceKES) * 100) : null,
        priceUSD:               newPlan.priceUSD ? Math.round(parseFloat(newPlan.priceUSD) * 100) : null,
        priceGBP:               newPlan.priceGBP ? Math.round(parseFloat(newPlan.priceGBP) * 100) : null,
        includesCorrections:    newPlan.includesCorrections,
        includesPlagiarismCheck:newPlan.includesPlagiarismCheck,
        includesFormat:         newPlan.includesFormat,
      }),
    });
    const data = await res.json();
    if (res.ok) { setNewPlan({...BLANK}); await load(); }
    else toast.error(data.error || "Something went wrong");
    setAdding(false);
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Plans & Pricing</h1>
        <p style={C.sub}>Add, edit or remove service plans. Changes take effect immediately for new orders.</p>

        {/* Add new plan */}
        <div style={C.addBox}>
          <div style={C.addT}>➕ Add New Plan</div>
          <div style={C.grid}>
            <div style={C.fg}>
              <label style={C.lbl}>Degree Level</label>
              <select style={C.sel} value={newPlan.degreeGroup} onChange={e=>setNewPlan(p=>({...p,degreeGroup:e.target.value}))}>
                {DEG_GROUPS.map(d=><option key={d} value={d}>{DEG_LBL[d]}</option>)}
              </select>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Plan Name</label>
              <select style={C.sel} value={newPlan.planName} onChange={e=>setNewPlan(p=>({...p,planName:e.target.value}))}>
                {PLAN_NAMES.map(n=><option key={n} value={n}>{PLAN_LBL[n]}</option>)}
              </select>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Pricing Type</label>
              <select style={C.sel} value={newPlan.pricingType} onChange={e=>setNewPlan(p=>({...p,pricingType:e.target.value}))}>
                <option value="FLAT">Flat Rate</option>
                <option value="PER_CHAPTER">Per Chapter</option>
              </select>
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Price NGN (₦)</label>
              <input style={C.inp} type="number" min="0" placeholder="e.g. 12000"
                value={newPlan.priceKobo} onChange={e=>setNewPlan(p=>({...p,priceKobo:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Price GHS (GH₵)</label>
              <input style={C.inp} type="number" min="0" placeholder="e.g. 85"
                value={newPlan.priceGHS} onChange={e=>setNewPlan(p=>({...p,priceGHS:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Price KES (KSh)</label>
              <input style={C.inp} type="number" min="0" placeholder="e.g. 1500"
                value={newPlan.priceKES} onChange={e=>setNewPlan(p=>({...p,priceKES:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Price USD ($)</label>
              <input style={C.inp} type="number" min="0" placeholder="e.g. 10"
                value={newPlan.priceUSD} onChange={e=>setNewPlan(p=>({...p,priceUSD:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Price GBP (£)</label>
              <input style={C.inp} type="number" min="0" placeholder="e.g. 8"
                value={newPlan.priceGBP} onChange={e=>setNewPlan(p=>({...p,priceGBP:e.target.value}))} />
            </div>
          </div>
          <div style={C.chkRow}>
            {[
              {label:"Includes Corrections",  field:"includesCorrections"},
              {label:"Includes Plagiarism Check", field:"includesPlagiarismCheck"},
              {label:"Includes Format",        field:"includesFormat"},
            ].map(f=>(
              <label key={f.field} style={C.chkItem}>
                <input type="checkbox" checked={(newPlan as any)[f.field]}
                  onChange={e=>setNewPlan(p=>({...p,[f.field]:e.target.checked}))} />
                {f.label}
              </label>
            ))}
          </div>
          <button style={C.btnA} disabled={adding} onClick={addPlan}>
            {adding ? "Adding..." : "+ Add Plan"}
          </button>
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <div style={C.card}>
            <div style={{overflowX:"auto"}}>
              <table style={C.table}>
                <thead style={C.thead}>
                  <tr>
                    {["Level","Plan","Type","₦ Price","GH₵","KSh","$","£","Corr","Plag","Fmt","Status","Actions"].map(h=>
                      <th key={h} style={C.th}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p:any) => {
                    const e = edits[p.id] || {};
                    const label = `${PLAN_LBL[p.planName]||p.planName} — ${DEG_LBL[p.degreeGroup]||p.degreeGroup}`;
                    return (
                      <tr key={p.id} style={{opacity:e.isActive===false?.6:1}}>
                        <td style={{...C.td,fontWeight:600,whiteSpace:"nowrap" as const,fontSize:".75rem"}}>{DEG_LBL[p.degreeGroup]||p.degreeGroup}</td>
                        <td style={C.td}><span style={{...C.badge,...C.bBlue}}>{PLAN_LBL[p.planName]||p.planName}</span></td>
                        <td style={C.td}>
                          <select style={C.tdSel} value={e.pricingType||p.pricingType}
                            onChange={ev=>updEdit(p.id,"pricingType",ev.target.value)}>
                            <option value="FLAT">Flat</option>
                            <option value="PER_CHAPTER">Per Ch</option>
                          </select>
                        </td>
                        <td style={C.td}>
                          <input style={C.tdInp} type="number" min="0"
                            value={e.priceKobo ?? p.priceKobo/100}
                            onChange={ev=>updEdit(p.id,"priceKobo",ev.target.value)} />
                        </td>
                        {["priceGHS","priceKES","priceUSD","priceGBP"].map(field => (
                          <td key={field} style={C.td}>
                            <input style={C.tdInp} type="number" min="0" placeholder="—"
                              value={e[field] !== undefined ? e[field] : (p[field] ? p[field]/100 : "")}
                              onChange={ev=>updEdit(p.id,field,ev.target.value)} />
                          </td>
                        ))}
                        <td style={{...C.td,textAlign:"center" as const}}>
                          <input type="checkbox" checked={e.includesCorrections ?? p.includesCorrections}
                            onChange={ev=>updEdit(p.id,"includesCorrections",ev.target.checked)} />
                        </td>
                        <td style={{...C.td,textAlign:"center" as const}}>
                          <input type="checkbox" checked={e.includesPlagiarismCheck ?? p.includesPlagiarismCheck}
                            onChange={ev=>updEdit(p.id,"includesPlagiarismCheck",ev.target.checked)} />
                        </td>
                        <td style={{...C.td,textAlign:"center" as const}}>
                          <input type="checkbox" checked={e.includesFormat ?? p.includesFormat}
                            onChange={ev=>updEdit(p.id,"includesFormat",ev.target.checked)} />
                        </td>
                        <td style={C.td}>
                          <span style={{...C.badge,...(e.isActive!==false?C.bGreen:C.bGrey)}}>
                            {e.isActive!==false?"Active":"Inactive"}
                          </span>
                        </td>
                        <td style={C.td}>
                          <div style={C.acts}>
                            <button style={C.btnS} disabled={saving===p.id} onClick={()=>savePlan(p.id)}>
                              {saving===p.id?"...":"💾 Save"}
                            </button>
                            <button style={C.btnT} onClick={()=>updEdit(p.id,"isActive",!(e.isActive??p.isActive))}>
                              {(e.isActive??p.isActive)?"⏸ Deactivate":"▶ Activate"}
                            </button>
                            <button style={C.btnR} disabled={saving==="del"+p.id} onClick={()=>deletePlan(p.id,label)}>
                              {saving==="del"+p.id?"...":"🗑 Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
