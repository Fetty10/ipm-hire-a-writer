"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:  { maxWidth:"900px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden" },
  table: { width:"100%", borderCollapse:"collapse" as const, fontSize:".78rem" },
  th:    { textAlign:"left" as const, padding:".6rem 1rem", fontSize:".6rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", borderBottom:"1px solid #E0F2FE", whiteSpace:"nowrap" as const, background:"#F8FBFF" },
  td:    { padding:".65rem 1rem", borderBottom:"1px solid #F0F9FF", color:"#0C1A2E", verticalAlign:"middle" as const },
  badge: { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700 },
  input: { width:"96px", padding:".35rem .6rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  btnS:  { padding:".35rem .75rem", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer" },
};

const DEG_LBL:Record<string,string>  = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};
const PLAN_LBL:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Professional"};

export default function AdminPlans() {
  const [plans,   setPlans]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string|null>(null);
  const [edits,   setEdits]   = useState<Record<string,string>>({});

  useEffect(()=>{
    fetch("/api/admin/settings?type=plans").then(r=>r.json()).then(d=>{
      if(d.success) setPlans(d.data.plans);
      setLoading(false);
    });
  },[]);

  async function save(id:string) {
    if(!edits[id]) return;
    setSaving(id);
    const res  = await fetch("/api/admin/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"plan",id,priceKobo:Math.round(parseFloat(edits[id])*100)})});
    const data = await res.json();
    if(res.ok) alert("Plan price updated!"); else alert(data.error);
    setSaving(null);
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Plans & Pricing</h1>
        <p style={C.sub}>Update pricing for all service plans. Changes apply immediately.</p>
        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <div style={C.card}>
            <div style={{overflowX:"auto"}}>
              <table style={C.table}>
                <thead>
                  <tr>{["Level","Plan","Type","Price (₦)","Includes","Active",""].map(h=><th key={h} style={C.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {plans.map((p:any)=>(
                    <tr key={p.id}>
                      <td style={{...C.td,fontWeight:600,whiteSpace:"nowrap" as const}}>{DEG_LBL[p.degreeGroup]||p.degreeGroup}</td>
                      <td style={C.td}><span style={{...C.badge,background:"#E0F2FE",color:"#0369A1"}}>{PLAN_LBL[p.planName]||p.planName}</span></td>
                      <td style={{...C.td,color:"#5B7EA6"}}>{p.pricingType==="FLAT"?"Flat":"Per Chapter"}</td>
                      <td style={C.td}>
                        <input style={C.input} type="number" defaultValue={p.priceKobo/100}
                          onChange={e=>setEdits(prev=>({...prev,[p.id]:e.target.value}))} />
                      </td>
                      <td style={{...C.td,color:"#5B7EA6",fontSize:".72rem"}}>
                        {[p.includesCorrections&&"Corrections",p.includesPlagiarismCheck&&"Plagiarism",p.includesFormat&&"Format"].filter(Boolean).join(", ")||"—"}
                      </td>
                      <td style={C.td}><span style={{...C.badge,...(p.isActive?{background:"#D1FAE5",color:"#065F46"}:{background:"#F1F5F9",color:"#64748B"})}}>{p.isActive?"Active":"Inactive"}</span></td>
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
