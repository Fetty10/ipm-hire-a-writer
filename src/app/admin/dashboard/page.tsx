"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:   { maxWidth:"1000px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:    { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  sbar:   { display:"flex", gap:".75rem", marginBottom:"1.25rem" },
  sinput: { flex:1, padding:".65rem 1rem .65rem 2.2rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  sbtn:   { padding:".65rem 1.25rem", borderRadius:"10px", background:"#0C1A2E", color:"#38BDF8", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  sgrid:  { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:".75rem", marginBottom:"1.25rem" },
  scard:  { background:"#fff", borderRadius:"14px", border:"1.5px solid #E0F2FE", padding:"1rem", cursor:"pointer", transition:"all .2s" },
  sicon:  { fontSize:"1.3rem", marginBottom:".5rem" },
  sval:   { fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:"#0C1A2E", lineHeight:1 },
  slabel: { fontSize:".72rem", color:"#5B7EA6", marginTop:".2rem" },
  grid2:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" },
  card:   { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem" },
  chead:  { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" },
  ctitle: { fontFamily:"'Syne',sans-serif", fontSize:".85rem", fontWeight:700, color:"#0C1A2E" },
  clink:  { fontSize:".75rem", color:"#0369A1", fontWeight:600, background:"none", border:"none", cursor:"pointer", textDecoration:"underline" },
  row:    { display:"flex", alignItems:"center", gap:".75rem", padding:".6rem 0", borderBottom:"1px solid #F0F9FF" },
  avatar: { width:"36px", height:"36px", borderRadius:"10px", background:"#E0F2FE", color:"#0369A1", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".75rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  rname:  { flex:1, fontSize:".82rem", fontWeight:700, color:"#0C1A2E" },
  rmeta:  { fontSize:".72rem", color:"#5B7EA6", marginTop:"2px" },
  btnG:   { padding:".35rem .75rem", borderRadius:"8px", background:"#D1FAE5", color:"#065F46", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnR:   { padding:".35rem .75rem", borderRadius:"8px", background:"#FEE2E2", color:"#991B1B", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnP:   { padding:".4rem .9rem", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontSize:".78rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", flexShrink:0 },
  empty:  { textAlign:"center" as const, padding:"2rem", fontSize:".8rem", color:"#5B7EA6" },
  table:  { width:"100%", borderCollapse:"collapse" as const, fontSize:".78rem" },
  th:     { textAlign:"left" as const, padding:".5rem .75rem", fontSize:".6rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", borderBottom:"1px solid #E0F2FE", whiteSpace:"nowrap" as const },
  td:     { padding:".6rem .75rem", borderBottom:"1px solid #F0F9FF", color:"#0C1A2E", verticalAlign:"middle" as const },
  badge:  { display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700 },
};

const STATUS_COLORS: Record<string,React.CSSProperties> = {
  DELIVERED:    {background:"#D1FAE5",color:"#065F46"},
  QC_REVIEW:    {background:"#E0F2FE",color:"#0369A1"},
  IN_PROGRESS:  {background:"#FEF9C3",color:"#854D0E"},
  PENDING_PAYMENT:{background:"#F1F5F9",color:"#64748B"},
  CANCELLED:    {background:"#FEE2E2",color:"#991B1B"},
};

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/admin/overview");
    const d   = await res.json();
    if (d.success) setData(d.data);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function actStaff(staffId:string, action:string) {
    const res = await fetch("/api/admin/staff",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({staffId,action})});
    const d   = await res.json();
    if (res.ok) load();
    else alert(d.error);
  }

  async function payWd(withdrawalId:string) {
    const res = await fetch("/api/withdrawals",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({withdrawalId,action:"approve"})});
    const d   = await res.json();
    if (res.ok) { alert(d.message); load(); }
    else alert(d.error);
  }

  const stats = data?.stats;

  const STATS = stats ? [
    {icon:"📦",val:stats.activeOrders,      label:"Active Orders",    href:"/admin/orders"},
    {icon:"👥",val:stats.activeStaff,        label:"Active Staff",     href:"/admin/staff/list"},
    {icon:"💰",val:`₦${(stats.revenueMonth||0).toLocaleString()}`,label:"Revenue (Month)",href:"/admin/orders"},
    {icon:"⏳",val:stats.pendingApprovals,   label:"Approvals",        href:"/admin/staff/approvals"},
    {icon:"💸",val:stats.pendingWithdrawals, label:"Withdrawals",      href:"/admin/withdrawals"},
    {icon:"✅",val:stats.totalOrders,        label:"Total Orders",     href:"/admin/orders"},
    {icon:"📄",val:stats.deliveredToday,     label:"Delivered Today",  href:"/admin/orders"},
    {icon:"🔍",val:stats.qcReview,           label:"In QC Review",     href:"/admin/orders"},
  ] : [];

  return (
    <AdminLayout badges={{"/admin/staff/approvals":stats?.pendingApprovals||0,"/admin/withdrawals":stats?.pendingWithdrawals||0}}>
      <div style={C.page}>
        <h1 style={C.h1}>Admin Overview</h1>
        <p style={C.sub}>Platform health at a glance.</p>

        {/* Search */}
        <div style={C.sbar}>
          <div style={{position:"relative",flex:1}}>
            <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
            <input style={C.sinput} placeholder="Search by topic, student name or phone..."
              value={search} onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&router.push(`/admin/orders?search=${search}`)} />
          </div>
          <button style={C.sbtn} onClick={()=>router.push(`/admin/orders?search=${search}`)}>Search</button>
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        ) : (
          <>
            {/* Stats */}
            <div style={C.sgrid}>
              {STATS.map(s=>(
                <div key={s.label} style={C.scard}
                  onClick={()=>router.push(s.href)}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#38BDF8";(e.currentTarget as HTMLElement).style.boxShadow="0 4px 16px rgba(14,165,233,.1)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E0F2FE";(e.currentTarget as HTMLElement).style.boxShadow="none";}}>
                  <div style={C.sicon}>{s.icon}</div>
                  <div style={C.sval}>{s.val}</div>
                  <div style={C.slabel}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Two-col */}
            <div style={C.grid2}>
              {/* Pending approvals */}
              <div style={C.card}>
                <div style={C.chead}>
                  <span style={C.ctitle}>Pending Staff Approvals</span>
                  <button style={C.clink} onClick={()=>router.push("/admin/staff/approvals")}>View all →</button>
                </div>
                {data.pendingStaff.length===0
                  ? <div style={C.empty}>No pending approvals.</div>
                  : data.pendingStaff.map((s:any)=>(
                    <div key={s.id} style={C.row}>
                      <div style={C.avatar}>{s.name.split(" ").map((n:string)=>n[0]).join("").slice(0,2)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={C.rname}>{s.name}</div>
                        <div style={C.rmeta}>{s.role} · {s.phone}</div>
                      </div>
                      <div style={{display:"flex",gap:".4rem"}}>
                        <button style={C.btnG} onClick={()=>actStaff(s.id,"approve")}>✓</button>
                        <button style={C.btnR} onClick={()=>actStaff(s.id,"decline")}>✕</button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pending withdrawals */}
              <div style={C.card}>
                <div style={C.chead}>
                  <span style={C.ctitle}>Pending Withdrawals</span>
                  <button style={C.clink} onClick={()=>router.push("/admin/withdrawals")}>View all →</button>
                </div>
                {data.pendingWds.length===0
                  ? <div style={C.empty}>No pending withdrawals.</div>
                  : data.pendingWds.map((w:any)=>(
                    <div key={w.id} style={C.row}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={C.rname}>{w.staffName} <span style={{fontWeight:400,color:"#5B7EA6",fontSize:".72rem"}}>({w.staffRole})</span></div>
                        <div style={C.rmeta}>{w.bankName} · ₦{(w.amountNaira||0).toLocaleString()}</div>
                      </div>
                      <button style={C.btnP} onClick={()=>payWd(w.id)}>Pay →</button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent orders */}
            <div style={C.card}>
              <div style={C.chead}>
                <span style={C.ctitle}>Recent Orders</span>
                <button style={C.clink} onClick={()=>router.push("/admin/orders")}>View all →</button>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={C.table}>
                  <thead>
                    <tr>{["Student","Phone","Topic","Level","Plan","Amount","Status"].map(h=><th key={h} style={C.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o:any)=>(
                      <tr key={o.id} style={{cursor:"pointer"}} onClick={()=>router.push("/admin/orders")}>
                        <td style={{...C.td,fontWeight:700}}>{o.studentName}</td>
                        <td style={{...C.td,color:"#5B7EA6"}}>{o.studentPhone}</td>
                        <td style={{...C.td,maxWidth:"140px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.topic}</td>
                        <td style={{...C.td,color:"#5B7EA6",whiteSpace:"nowrap"}}>{o.degreeGroup?.replace(/_/g,"/")}</td>
                        <td style={C.td}><span style={{...C.badge,background:"#E0F2FE",color:"#0369A1"}}>{o.planName}</span></td>
                        <td style={{...C.td,fontWeight:700,color:"#0284C7",whiteSpace:"nowrap"}}>₦{(o.amountPaid||0).toLocaleString()}</td>
                        <td style={C.td}><span style={{...C.badge,...(STATUS_COLORS[o.status]||{background:"#F1F5F9",color:"#64748B"})}}>{o.status?.replace(/_/g," ")}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
