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
  badge: { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700, background:"#E0F2FE", color:"#0369A1" },
  input: { width:"96px", padding:".35rem .6rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  btnS:  { padding:".35rem .75rem", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer" },
};

const ROLE_LBL:Record<string,string>  = {WRITER:"Writer",ANALYST:"Analyst",QC:"QC"};
const DEG_LBL:Record<string,string>   = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};
const PLAN_LBL:Record<string,string>  = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Pro"};

export default function AdminPayRates() {
  const [rates,   setRates]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string|null>(null);
  const [edits,   setEdits]   = useState<Record<string,string>>({});

  useEffect(()=>{
    fetch("/api/admin/settings?type=payrates").then(r=>r.json()).then(d=>{
      if(d.success) setRates(d.data.payRates);
      setLoading(false);
    });
  },[]);

  async function save(id:string) {
    if(!edits[id]) return;
    setSaving(id);
    const res  = await fetch("/api/admin/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"payrate",id,amountKobo:Math.round(parseFloat(edits[id])*100)})});
    const data = await res.json();
    if(res.ok) alert("Pay rate updated!"); else alert(data.error);
    setSaving(null);
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Pay Rates</h1>
        <p style={C.sub}>Control what each role earns per chapter per plan.</p>
        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <div style={C.card}>
            <div style={{overflowX:"auto"}}>
              <table style={C.table}>
                <thead>
                  <tr>{["Role","Level","Plan","Chapter","Amount (₦)",""].map(h=><th key={h} style={C.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rates.map((r:any)=>(
                    <tr key={r.id}>
                      <td style={C.td}><span style={C.badge}>{ROLE_LBL[r.role]||r.role}</span></td>
                      <td style={{...C.td,color:"#5B7EA6",whiteSpace:"nowrap" as const}}>{DEG_LBL[r.degreeGroup]||r.degreeGroup}</td>
                      <td style={{...C.td,color:"#5B7EA6"}}>{PLAN_LBL[r.planName]||r.planName}</td>
                      <td style={{...C.td,color:"#5B7EA6"}}>{r.chapterNumber??"All"}</td>
                      <td style={C.td}>
                        <input style={C.input} type="number" defaultValue={r.amountKobo/100}
                          onChange={e=>setEdits(prev=>({...prev,[r.id]:e.target.value}))} />
                      </td>
                      <td style={C.td}>
                        <button style={C.btnS} disabled={saving===r.id} onClick={()=>save(r.id)}>
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
