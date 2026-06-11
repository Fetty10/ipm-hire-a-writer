"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:  { maxWidth:"1000px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  sbar:  { display:"flex", gap:".75rem", marginBottom:"1rem", flexWrap:"wrap" as const },
  sinput:{ flex:1, minWidth:"180px", padding:".65rem 1rem .65rem 2.2rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  sel:   { padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden" },
  table: { width:"100%", borderCollapse:"collapse" as const, fontSize:".78rem" },
  th:    { textAlign:"left" as const, padding:".6rem 1rem", fontSize:".6rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", borderBottom:"1px solid #E0F2FE", whiteSpace:"nowrap" as const, background:"#F8FBFF" },
  td:    { padding:".65rem 1rem", borderBottom:"1px solid #F0F9FF", color:"#0C1A2E", verticalAlign:"middle" as const },
  badge: { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700 },
  btnY:  { padding:".35rem .75rem", borderRadius:"8px", background:"#FEF9C3", color:"#854D0E", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnG:  { padding:".35rem .75rem", borderRadius:"8px", background:"#D1FAE5", color:"#065F46", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer" },
  modal: { position:"fixed" as const, inset:0, background:"rgba(12,26,46,.6)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" },
  mCard: { background:"#fff", borderRadius:"20px", padding:"1.5rem", maxWidth:"420px", width:"100%" },
  mTitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:700, color:"#0C1A2E", marginBottom:".5rem" },
  mSub:  { fontSize:".82rem", color:"#5B7EA6", marginBottom:"1rem" },
  ta:    { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", marginBottom:"1rem", resize:"vertical" as const, minHeight:"60px" },
  mbtns: { display:"flex", gap:".5rem" },
  btnR:  { padding:".55rem 1.1rem", borderRadius:"10px", background:"#FEE2E2", color:"#991B1B", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnN:  { padding:".55rem 1.1rem", borderRadius:"10px", background:"#F1F5F9", color:"#64748B", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer" },
};

export default function StaffList() {
  const [staff,   setStaff]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role,    setRole]    = useState("all");
  const [search,  setSearch]  = useState("");
  const [acting,  setActing]  = useState<string|null>(null);
  const [modal,   setModal]   = useState<any>(null);
  const [reason,  setReason]  = useState("");

  async function load() {
    setLoading(true);
    const res  = await fetch(`/api/admin/staff?role=${role}&search=${encodeURIComponent(search)}&filter=active`);
    const data = await res.json();
    if(data.success) setStaff(data.data);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[role,search]);

  async function act(staffId:string, action:string) {
    setActing(staffId);
    const res  = await fetch("/api/admin/staff",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({staffId,action,reason})});
    const data = await res.json();
    if(res.ok){ setModal(null); setReason(""); load(); }
    else alert(data.error);
    setActing(null);
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>All Staff</h1>
        <p style={C.sub}>Manage writers, analysts and QC staff.</p>
        <div style={C.sbar}>
          <div style={{position:"relative",flex:1,minWidth:"180px"}}>
            <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
            <input style={C.sinput} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or phone..." />
          </div>
          <select style={C.sel} value={role} onChange={e=>setRole(e.target.value)}>
            {["all","WRITER","ANALYST","QC"].map(r=><option key={r} value={r}>{r==="all"?"All Roles":r}</option>)}
          </select>
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <div style={C.card}>
            <div style={{overflowX:"auto"}}>
              <table style={C.table}>
                <thead>
                  <tr>{["Name","Phone","Email","Role","Active Jobs","Total Earned","Status","Actions"].map(h=><th key={h} style={C.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {staff.map((s:any)=>(
                    <tr key={s.id}>
                      <td style={{...C.td,fontWeight:700,whiteSpace:"nowrap" as const}}>{s.name}</td>
                      <td style={{...C.td,color:"#5B7EA6"}}>{s.phone}</td>
                      <td style={{...C.td,color:"#5B7EA6",maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{s.email}</td>
                      <td style={C.td}><span style={{...C.badge,background:"#E0F2FE",color:"#0369A1"}}>{s.role}</span></td>
                      <td style={{...C.td,textAlign:"center" as const}}>{s.activeJobs}</td>
                      <td style={{...C.td,fontWeight:700,color:"#0284C7",whiteSpace:"nowrap" as const}}>₦{(s.totalEarnedNaira||0).toLocaleString()}</td>
                      <td style={C.td}><span style={{...C.badge,...(s.isSuspended?{background:"#FEE2E2",color:"#991B1B"}:{background:"#D1FAE5",color:"#065F46"})}}>{s.isSuspended?"Suspended":"Active"}</span></td>
                      <td style={C.td}>
                        {s.isSuspended
                          ? <button style={C.btnG} disabled={acting===s.id} onClick={()=>act(s.id,"unsuspend")}>Unsuspend</button>
                          : <button style={C.btnY} onClick={()=>setModal({id:s.id,name:s.name})}>Suspend</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {modal && (
          <div style={C.modal} onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
            <div style={C.mCard}>
              <div style={C.mTitle}>Suspend {modal.name}?</div>
              <div style={C.mSub}>They will be locked out immediately. Provide a reason (optional).</div>
              <textarea style={C.ta} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for suspension (optional)" rows={2} />
              <div style={C.mbtns}>
                <button style={C.btnR} disabled={acting===modal.id} onClick={()=>act(modal.id,"suspend")}>
                  {acting===modal.id?"Suspending...":"Confirm Suspend"}
                </button>
                <button style={C.btnN} onClick={()=>setModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
