"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";

const C = {
  page:  { maxWidth:"860px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.5rem", fontWeight:800, color:"#0C1A2E", marginBottom:".25rem" },
  sub:   { fontSize:".82rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  row:   { display:"flex", gap:".75rem", alignItems:"center", marginBottom:"1.25rem", flexWrap:"wrap" as const },
  srch:  { flex:1, minWidth:"200px", padding:".6rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".83rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  count: { fontSize:".78rem", color:"#5B7EA6" },
  table: { width:"100%", borderCollapse:"collapse" as const, background:"#fff", borderRadius:"14px", overflow:"hidden", border:"1.5px solid #E0F2FE" },
  th:    { background:"#F0F9FF", padding:".65rem 1rem", fontSize:".68rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".06em", color:"#5B7EA6", textAlign:"left" as const },
  td:    { padding:".75rem 1rem", fontSize:".82rem", color:"#0C1A2E", borderTop:"1px solid #E0F2FE", verticalAlign:"middle" as const },
  name:  { fontWeight:700, color:"#0369A1", cursor:"pointer", textDecoration:"underline", textUnderlineOffset:"2px" },
  badge: { padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700, background:"#DBEAFE", color:"#1D4ED8" },
  btnD:  { padding:".4rem .75rem", borderRadius:"8px", border:"none", background:"#FEE2E2", color:"#991B1B", fontSize:".75rem", fontWeight:700, cursor:"pointer" },
  btnO:  { padding:".4rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", background:"#fff", color:"#0369A1", fontSize:".75rem", fontWeight:700, cursor:"pointer" },
  pg:    { display:"flex", gap:".4rem", justifyContent:"center", marginTop:"1.25rem", flexWrap:"wrap" as const },
  pgBtn: { padding:".4rem .8rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".78rem", fontWeight:700, cursor:"pointer", background:"#fff", color:"#0C1A2E" },
  pgA:   { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  pgD:   { opacity:.4, cursor:"not-allowed" as const },
  // Drawer
  overlay:{ position:"fixed" as const, inset:0, background:"rgba(12,26,46,.55)", zIndex:40 },
  drawer: { position:"fixed" as const, top:0, right:0, bottom:0, width:"100%", maxWidth:"560px", background:"#fff", zIndex:50, overflowY:"auto" as const, padding:"1.5rem", boxShadow:"-4px 0 24px rgba(14,165,233,.1)" },
  dh1:   { fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#0C1A2E", marginBottom:".25rem" },
  dmeta: { fontSize:".78rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  ocard: { background:"#F0F9FF", borderRadius:"12px", border:"1px solid #BAE6FD", padding:"1rem", marginBottom:".75rem" },
  otopic:{ fontWeight:700, fontSize:".85rem", color:"#0C1A2E", marginBottom:".3rem" },
  ometa: { fontSize:".73rem", color:"#5B7EA6", display:"flex", gap:".5rem", flexWrap:"wrap" as const, marginBottom:".5rem" },
  ostatus:{ padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700, background:"#D1FAE5", color:"#065F46" },
  closeBtn:{ background:"none", border:"none", fontSize:"1.25rem", cursor:"pointer", color:"#5B7EA6", float:"right" as const },
  delbanner:{ background:"#FEF2F2", border:"1.5px solid #FCA5A5", borderRadius:"12px", padding:"1rem", marginBottom:"1.25rem" },
  warnTxt:{ fontSize:".8rem", color:"#991B1B", lineHeight:1.6, marginBottom:".75rem" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem", color:"#5B7EA6" },
};

const STATUS_LABEL: Record<string,string> = {
  PENDING_PAYMENT:"Pending Payment", ACTIVE:"Active", IN_PROGRESS:"In Progress",
  DELIVERED:"Delivered", COMPLETED:"Completed", CANCELLED:"Cancelled",
};

export default function AdminStudents() {
  const [students,   setStudents]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [total,      setTotal]      = useState(0);

  // Drawer
  const [selected,   setSelected]   = useState<any|null>(null);
  const [orders,     setOrders]     = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Delete confirmation
  const [confirmDel, setConfirmDel] = useState<string|null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/students?search=${encodeURIComponent(search)}&page=${page}`);
    const data = await res.json();
    if (data.success) {
      setStudents(data.data);
      setTotal(data.total);
      setPages(data.pages);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  // When search changes, reset to page 1
  useEffect(() => { setPage(1); }, [search]);

  async function openStudent(student: any) {
    setSelected(student);
    setConfirmDel(null);
    setLoadingOrders(true);
    setOrders([]);
    const res  = await fetch(`/api/admin/orders?clientId=${student.id}`);
    const data = await res.json();
    if (data.success) setOrders(data.data || []);
    setLoadingOrders(false);
  }

  async function deleteStudent(studentId: string) {
    setDeleting(true);
    const res  = await fetch("/api/admin/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message);
      setSelected(null);
      setConfirmDel(null);
      load();
    } else {
      toast.error(data.error || "Failed to delete.");
    }
    setDeleting(false);
  }

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Students</h1>
        <p style={C.sub}>All registered student accounts — click a name to view their orders.</p>

        <div style={C.row}>
          <input style={C.srch} placeholder="Search by name, email or phone..." value={search}
            onChange={e => setSearch(e.target.value)} />
          {!loading && <span style={C.count}>{total} student{total!==1?"s":""}</span>}
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        ) : students.length === 0 ? (
          <div style={C.empty}>
            <div style={{fontSize:"2rem",marginBottom:".75rem"}}>👤</div>
            <p style={{fontWeight:700}}>No students found</p>
          </div>
        ) : (
          <>
            <table style={C.table}>
              <thead>
                <tr>
                  <th style={C.th}>Name</th>
                  <th style={C.th}>Email</th>
                  <th style={C.th}>WhatsApp</th>
                  <th style={C.th}>Orders</th>
                  <th style={C.th}>Joined</th>
                  <th style={C.th}></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s:any) => (
                  <tr key={s.id}>
                    <td style={C.td}>
                      <span style={C.name} onClick={() => openStudent(s)}>{s.name}</span>
                    </td>
                    <td style={C.td}>{s.email}</td>
                    <td style={C.td}>{s.phone || <span style={{color:"#CBD5E1"}}>—</span>}</td>
                    <td style={C.td}>
                      {s.orderCount > 0
                        ? <span style={C.badge}>{s.orderCount} order{s.orderCount!==1?"s":""}</span>
                        : <span style={{color:"#CBD5E1",fontSize:".75rem"}}>None</span>}
                    </td>
                    <td style={C.td}>{new Date(s.createdAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"})}</td>
                    <td style={C.td}>
                      <div style={{display:"flex",gap:".4rem"}}>
                        <button style={C.btnO} onClick={() => openStudent(s)}>View</button>
                        <button style={C.btnD} onClick={() => { setSelected(s); setConfirmDel(s.id); }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pages > 1 && (
              <div style={C.pg}>
                <button style={{...C.pgBtn,...(page===1?C.pgD:{})}} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
                {Array.from({length:pages},(_,i)=>i+1).map(p=>(
                  <button key={p} style={{...C.pgBtn,...(p===page?C.pgA:{})}} onClick={()=>setPage(p)}>{p}</button>
                ))}
                <button style={{...C.pgBtn,...(page===pages?C.pgD:{})}} disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Student Detail Drawer */}
      {selected && (
        <>
          <div style={C.overlay} onClick={() => { setSelected(null); setConfirmDel(null); }} />
          <div style={C.drawer}>
            <button style={C.closeBtn} onClick={() => { setSelected(null); setConfirmDel(null); }}>✕</button>
            <div style={C.dh1}>{selected.name}</div>
            <div style={C.dmeta}>
              {selected.email} · {selected.phone || "No phone"} · Joined {new Date(selected.createdAt).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"})}
            </div>

            {/* Delete confirmation banner */}
            {confirmDel === selected.id ? (
              <div style={C.delbanner}>
                <p style={C.warnTxt}>
                  ⚠️ <strong>This action is permanent.</strong> Deleting <strong>{selected.name}</strong> will remove their account and all associated orders, chapters, and correction history from the database. This cannot be undone.
                </p>
                <div style={{display:"flex",gap:".5rem"}}>
                  <button disabled={deleting} onClick={() => deleteStudent(selected.id)}
                    style={{padding:".5rem 1rem",borderRadius:"8px",border:"none",background:"#991B1B",color:"#fff",fontSize:".8rem",fontWeight:700,cursor:"pointer"}}>
                    {deleting ? "Deleting..." : "Yes, Delete Permanently"}
                  </button>
                  <button onClick={() => setConfirmDel(null)}
                    style={{padding:".5rem 1rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",background:"#fff",color:"#0369A1",fontSize:".8rem",fontWeight:700,cursor:"pointer"}}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button style={C.btnD} onClick={() => setConfirmDel(selected.id)}>🗑 Delete Student</button>
            )}

            <div style={{marginTop:"1.5rem"}}>
              <div style={{fontSize:".72rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".08em",color:"#5B7EA6",marginBottom:".75rem"}}>
                Orders ({orders.length})
              </div>

              {loadingOrders ? (
                <div style={{textAlign:"center",padding:"2rem",color:"#5B7EA6"}}>Loading orders...</div>
              ) : orders.length === 0 ? (
                <div style={{textAlign:"center",padding:"2rem",color:"#CBD5E1",fontSize:".83rem"}}>No orders yet.</div>
              ) : (
                orders.map((o:any) => (
                  <div key={o.id} style={C.ocard}>
                    <div style={C.otopic}>{o.topic}</div>
                    <div style={C.ometa}>
                      <span>{o.degreeGroup}</span>
                      <span>·</span>
                      <span>{o.department}</span>
                      <span>·</span>
                      <span>{new Date(o.createdAt).toLocaleDateString("en-NG")}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={C.ostatus}>{STATUS_LABEL[o.status]||o.status}</span>
                      <a href={`/admin/orders?orderId=${o.id}`} target="_blank" rel="noreferrer"
                        style={{fontSize:".75rem",fontWeight:700,color:"#0369A1",textDecoration:"none"}}>
                        View Full Detail →
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
