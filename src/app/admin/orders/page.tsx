"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:  { maxWidth:"1100px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  sbar:  { display:"flex", gap:".75rem", marginBottom:"1rem", flexWrap:"wrap" as const },
  sinput:{ flex:1, minWidth:"200px", padding:".65rem 1rem .65rem 2.2rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  sel:   { padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  total: { fontSize:".78rem", color:"#5B7EA6", marginBottom:".75rem" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden" },
  table: { width:"100%", borderCollapse:"collapse" as const, fontSize:".78rem" },
  th:    { textAlign:"left" as const, padding:".6rem 1rem", fontSize:".6rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", borderBottom:"1px solid #E0F2FE", whiteSpace:"nowrap" as const, background:"#F8FBFF" },
  td:    { padding:".65rem 1rem", borderBottom:"1px solid #F0F9FF", color:"#0C1A2E", verticalAlign:"middle" as const },
  badge: { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700, whiteSpace:"nowrap" as const },
};

const STATUSES = ["all","IN_PROGRESS","QC_REVIEW","DELIVERED","PENDING_PAYMENT","CANCELLED"];
const STATUS_COLORS:Record<string,React.CSSProperties> = {
  DELIVERED:{background:"#D1FAE5",color:"#065F46"},
  QC_REVIEW:{background:"#E0F2FE",color:"#0369A1"},
  IN_PROGRESS:{background:"#FEF9C3",color:"#854D0E"},
  PENDING_PAYMENT:{background:"#F1F5F9",color:"#64748B"},
  CANCELLED:{background:"#FEE2E2",color:"#991B1B"},
};

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState(searchParams.get("search")||"");
  const [status,  setStatus]  = useState(searchParams.get("status")||"all");

  useEffect(()=>{
    async function load() {
      setLoading(true);
      const res  = await fetch(`/api/admin/orders?status=${status}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if(data.success){ setOrders(data.data.orders); setTotal(data.data.total); }
      setLoading(false);
    }
    load();
  },[status,search]);

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>All Orders</h1>
        <p style={C.sub}>Complete order list with full management controls.</p>
        <div style={C.sbar}>
          <div style={{position:"relative",flex:1,minWidth:"200px"}}>
            <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
            <input style={C.sinput} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by topic, student name or phone..." />
          </div>
          <select style={C.sel} value={status} onChange={e=>setStatus(e.target.value)}>
            {STATUSES.map(s=><option key={s} value={s}>{s==="all"?"All Statuses":s.replace(/_/g," ")}</option>)}
          </select>
        </div>
        <p style={C.total}>{total} orders found</p>
        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <div style={C.card}>
            <div style={{overflowX:"auto"}}>
              <table style={C.table}>
                <thead>
                  <tr>{["#","Student","Phone","Topic","Level","Plan","Amount","Status","Chapters"].map(h=><th key={h} style={C.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {orders.map((o:any)=>(
                    <tr key={o.id} style={{cursor:"pointer"}} onClick={()=>{}}>
                      <td style={{...C.td,color:"#5B7EA6",fontWeight:600}}>{o.id.slice(-6).toUpperCase()}</td>
                      <td style={{...C.td,fontWeight:700,whiteSpace:"nowrap" as const}}>{o.student?.name}</td>
                      <td style={{...C.td,color:"#5B7EA6",whiteSpace:"nowrap" as const}}>{o.student?.phone}</td>
                      <td style={{...C.td,maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{o.topic}</td>
                      <td style={{...C.td,color:"#5B7EA6",whiteSpace:"nowrap" as const}}>{o.degreeGroup?.replace(/_/g,"/")}</td>
                      <td style={C.td}><span style={{...C.badge,background:"#E0F2FE",color:"#0369A1"}}>{o.planName}</span></td>
                      <td style={{...C.td,fontWeight:700,color:"#0284C7",whiteSpace:"nowrap" as const}}>₦{(o.amountPaid||0).toLocaleString()}</td>
                      <td style={C.td}><span style={{...C.badge,...(STATUS_COLORS[o.status]||{background:"#F1F5F9",color:"#64748B"})}}>{o.status?.replace(/_/g," ")}</span></td>
                      <td style={{...C.td,color:"#5B7EA6",whiteSpace:"nowrap" as const}}>
                        {o.chapters?.filter((c:any)=>c.status==="DELIVERED").length}/{o.chapters?.length}
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

export default function AdminOrders() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#5B7EA6"}}>Loading...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
