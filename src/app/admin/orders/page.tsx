"use client";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";

const STATUSES = [
  { value:"all",             label:"All Statuses" },
  { value:"IN_PROGRESS",    label:"In Progress" },
  { value:"QC_REVIEW",      label:"QC Review" },
  { value:"DELIVERED",      label:"Has Delivered Chapters" },
  { value:"PENDING_PAYMENT",label:"Pending Payment" },
  { value:"CANCELLED",      label:"Cancelled" },
];

const STATUS_COLORS:Record<string,React.CSSProperties> = {
  DELIVERED:       { background:"#D1FAE5", color:"#065F46" },
  QC_REVIEW:       { background:"#EDE9FE", color:"#5B21B6" },
  QC_IN_PROGRESS:  { background:"#EDE9FE", color:"#5B21B6" },
  IN_PROGRESS:     { background:"#FEF9C3", color:"#854D0E" },
  NOT_STARTED:     { background:"#F1F5F9", color:"#64748B" },
  PENDING_PAYMENT: { background:"#F1F5F9", color:"#64748B" },
  CANCELLED:       { background:"#FEE2E2", color:"#991B1B" },
  SUBMITTED:       { background:"#E0F2FE", color:"#0369A1" },
};

const C = {
  page:    { maxWidth:"1200px", margin:"0 auto" },
  h1:      { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:     { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  sbar:    { display:"flex", gap:".75rem", marginBottom:"1rem", flexWrap:"wrap" as const },
  sinput:  { flex:1, minWidth:"200px", padding:".65rem 1rem .65rem 2.2rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  sel:     { padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  total:   { fontSize:".78rem", color:"#5B7EA6", marginBottom:".75rem" },
  card:    { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden", marginBottom:".5rem", cursor:"pointer" },
  row:     { display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr auto auto", gap:"1rem", alignItems:"center", padding:".85rem 1.25rem" },
  rtitle:  { fontFamily:"'Syne',sans-serif", fontSize:".85rem", fontWeight:700, color:"#0C1A2E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const },
  rmeta:   { fontSize:".72rem", color:"#5B7EA6", marginTop:"2px" },
  badge:   { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700, whiteSpace:"nowrap" as const },
  chevron: { color:"#5B7EA6", fontSize:"1.1rem", fontWeight:700 },
  // Detail panel
  panel:   { position:"fixed" as const, top:0, right:0, width:"500px", height:"100vh", background:"#fff", borderLeft:"1.5px solid #E0F2FE", boxShadow:"-8px 0 32px rgba(0,0,0,.1)", zIndex:40, overflowY:"auto" as const, padding:"1.5rem" },
  overlay: { position:"fixed" as const, inset:0, background:"rgba(12,26,46,.4)", zIndex:39 },
  ph:      { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem" },
  ptitle:  { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:800, color:"#0C1A2E" },
  pclose:  { background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#5B7EA6" },
  sect:    { marginBottom:"1.25rem" },
  sl:      { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", marginBottom:".6rem", display:"block" },
  infoBox: { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".85rem 1rem" },
  irow:    { display:"flex", justifyContent:"space-between", fontSize:".8rem", marginBottom:".3rem", gap:"1rem" },
  ilbl:    { color:"#5B7EA6", flexShrink:0 },
  ival:    { fontWeight:600, color:"#0C1A2E", textAlign:"right" as const },
  chCard:  { border:"1.5px solid #E0F2FE", borderRadius:"12px", padding:".85rem 1rem", marginBottom:".5rem" },
  chHead:  { display:"flex", alignItems:"center", gap:".75rem", marginBottom:".5rem" },
  chNum:   { width:"30px", height:"30px", borderRadius:"8px", background:"#E0F2FE", color:"#0369A1", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".75rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  chNumD:  { width:"30px", height:"30px", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".75rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  chInfo:  { flex:1 },
  chTitle: { fontSize:".85rem", fontWeight:700, color:"#0C1A2E" },
  chStaff: { fontSize:".72rem", color:"#5B7EA6", marginTop:"2px" },
  chBtns:  { display:"flex", gap:".4rem", marginTop:".5rem", flexWrap:"wrap" as const },
  btnSm:   { padding:".3rem .75rem", borderRadius:"7px", fontSize:".7rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnB:    { background:"#E0F2FE", color:"#0369A1" },
  btnR:    { background:"#FEE2E2", color:"#991B1B" },
  btnG:    { background:"#D1FAE5", color:"#065F46" },
  adjBox:  { background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:"10px", padding:".85rem 1rem", marginBottom:"1rem" },
  adjT:    { fontSize:".72rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#9A3412", marginBottom:".6rem" },
  ta:      { width:"100%", padding:".6rem .9rem", borderRadius:"8px", border:"1px solid #FED7AA", fontSize:".8rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"60px", boxSizing:"border-box" as const, background:"#fff" },
  btnSave: { marginTop:".5rem", padding:".45rem 1rem", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontSize:".78rem", fontWeight:700, border:"none", cursor:"pointer" },
  staffSel:{ width:"100%", padding:".55rem .9rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".8rem", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff", marginBottom:".4rem", boxSizing:"border-box" as const },
  dlBtn:   { fontSize:".72rem", color:"#0369A1", fontWeight:600, background:"none", border:"none", cursor:"pointer", textDecoration:"underline" },
  orderBtns:{ display:"flex", gap:".5rem", flexWrap:"wrap" as const },
};

const DEG:Record<string,string> = { OND_HND_NCE:"HND/OND", BSC_BED_BA:"BSc/BEd", PGD_MSC_PHD:"PGD/MSc" };

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || { background:"#F1F5F9", color:"#64748B" };
  return <span style={{ ...C.badge, ...s }}>{status.replace(/_/g," ")}</span>;
}

function OrderDetail({ orderId, onClose, staffList }: { orderId:string, onClose:()=>void, staffList:any[] }) {
  const [order,    setOrder]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [note,     setNote]     = useState("");
  const [saving,   setSaving]   = useState<string|null>(null);
  const [reassign, setReassign] = useState<string|null>(null);
  const [newStaff, setNewStaff] = useState("");

  async function load() {
    const res  = await fetch(`/api/admin/orders?orderId=${orderId}`);
    const data = await res.json();
    if (data.success) { setOrder(data.data); setNote(data.data.specialInstructions||""); }
    setLoading(false);
  }
  useEffect(() => { load(); }, [orderId]);

  async function act(action: string, extra: any = {}) {
    setSaving(action + (extra.chapterId||""));
    const res  = await fetch("/api/admin/orders", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, orderId, ...extra }),
    });
    const data = await res.json();
    if (res.ok) { alert(data.message); load(); }
    else alert(data.error);
    setSaving(null);
    setReassign(null);
    setNewStaff("");
  }

  if (loading) return (
    <>
      <div style={C.overlay} onClick={onClose} />
      <div style={C.panel}><div style={{ textAlign:"center", padding:"3rem", color:"#5B7EA6" }}>Loading...</div></div>
    </>
  );
  if (!order) return null;

  return (
    <>
      <div style={C.overlay} onClick={onClose} />
      <div style={C.panel}>
        <div style={C.ph}>
          <div style={C.ptitle}>Order Details</div>
          <button style={C.pclose} onClick={onClose}>×</button>
        </div>

        {/* Student */}
        <div style={C.sect}>
          <span style={C.sl}>Student</span>
          <div style={C.infoBox}>
            {[
              { label:"Name",  val:order.client?.name },
              { label:"Email", val:order.client?.email },
              { label:"Phone", val:order.client?.phone||"—" },
            ].map(r => (
              <div key={r.label} style={C.irow}>
                <span style={C.ilbl}>{r.label}</span>
                <span style={C.ival}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order info */}
        <div style={C.sect}>
          <span style={C.sl}>Order</span>
          <div style={C.infoBox}>
            {[
              { label:"Topic",       val:order.topic },
              { label:"Department",  val:order.department||"—" },
              { label:"Level",       val:DEG[order.degreeGroup]||order.degreeGroup },
              { label:"Plan",        val:order.plan?.planName },
              { label:"Amount Paid", val:`₦${((order.amountPaidKobo||0)/100).toLocaleString()}` },
              { label:"Status",      val:<StatusBadge status={order.status}/> },
              { label:"Paid At",     val:order.paidAt?new Date(order.paidAt).toLocaleDateString("en-NG"):"—" },
            ].map(r => (
              <div key={r.label} style={C.irow}>
                <span style={C.ilbl}>{r.label}</span>
                <span style={C.ival}>{r.val as any}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chapters */}
        <div style={C.sect}>
          <span style={C.sl}>Chapters ({order.chapters?.length})</span>
          {order.chapters?.map((ch: any) => (
            <div key={ch.id} style={C.chCard}>
              <div style={C.chHead}>
                <div style={ch.status==="DELIVERED" ? C.chNumD : C.chNum}>{ch.chapterNumber}</div>
                <div style={C.chInfo}>
                  <div style={C.chTitle}>{ch.chapterLabel}</div>
                  <div style={C.chStaff}>
                    {ch.assignedTo ? `${ch.assignedTo.name} (${ch.assignedTo.role})` : "Unassigned"}
                    {ch.routedToQcId ? " → QC assigned" : ""}
                  </div>
                </div>
                <StatusBadge status={ch.status} />
              </div>

              <div style={{ display:"flex", gap:"1rem", marginBottom:".5rem" }}>
                {ch.submittedFileUrl && (
                  <a href={ch.submittedFileUrl} target="_blank" rel="noreferrer" style={C.dlBtn}>📄 Submitted</a>
                )}
                {ch.deliveredFileUrl && (
                  <a href={ch.deliveredFileUrl} target="_blank" rel="noreferrer" style={C.dlBtn}>✅ Delivered</a>
                )}
              </div>

              <div style={C.chBtns}>
                <button style={{ ...C.btnSm, ...C.btnB }} onClick={() => setReassign(reassign===ch.id ? null : ch.id)}>
                  👤 Reassign
                </button>
                {["IN_PROGRESS","NOT_STARTED"].includes(ch.status) && (
                  <button style={{ ...C.btnSm, ...C.btnR }}
                    disabled={saving==="reset_chapter"+ch.id}
                    onClick={() => act("reset_chapter", { chapterId:ch.id })}>
                    🔄 Reset
                  </button>
                )}
              </div>

              {reassign === ch.id && (
                <div style={{ marginTop:".6rem", paddingTop:".6rem", borderTop:"1px dashed #BAE6FD" }}>
                  <select style={C.staffSel} value={newStaff} onChange={e => setNewStaff(e.target.value)}>
                    <option value="">-- Select staff member --</option>
                    {staffList.filter(s => ["WRITER","ANALYST"].includes(s.role)).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                  <button style={{ ...C.btnSm, ...C.btnG }}
                    disabled={!newStaff || saving==="reassign_chapter"+ch.id}
                    onClick={() => act("reassign_chapter", { chapterId:ch.id, staffId:newStaff })}>
                    {saving==="reassign_chapter"+ch.id ? "Saving..." : "Confirm Reassign"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Admin note */}
        <div style={C.adjBox}>
          <div style={C.adjT}>Admin Note / Special Instructions</div>
          <textarea style={C.ta} rows={3} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Add or update special instructions for this order..." />
          <button style={C.btnSave} disabled={saving==="add_note"} onClick={() => act("add_note", { notes:note })}>
            {saving==="add_note" ? "Saving..." : "Save Note"}
          </button>
        </div>

        {/* Order actions */}
        <div style={C.sect}>
          <span style={C.sl}>Order Actions</span>
          <div style={C.orderBtns}>
            {order.status !== "DELIVERED" && (
              <button style={{ ...C.btnSm, ...C.btnG, padding:".5rem 1rem" }}
                disabled={saving==="mark_delivered"}
                onClick={() => { if (confirm("Mark this entire order as delivered?")) act("mark_delivered"); }}>
                ✅ Mark Delivered
              </button>
            )}
            {order.status !== "CANCELLED" && (
              <button style={{ ...C.btnSm, ...C.btnR, padding:".5rem 1rem" }}
                disabled={saving==="cancel"}
                onClick={() => { if (confirm("Cancel this order? This cannot be undone.")) act("cancel"); }}>
                ✕ Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [search,   setSearch]   = useState(searchParams.get("search")||"");
  const [status,   setStatus]   = useState(searchParams.get("status")||"all");
  const [selected, setSelected] = useState<string|null>(null);
  const [staffList,setStaffList]= useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/staff?filter=approved")
      .then(r => r.json())
      .then(d => { if (d.success) setStaffList(d.data); });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res  = await fetch(`/api/admin/orders?status=${status}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) { setOrders(data.data.orders); setTotal(data.data.total); }
      setLoading(false);
    }
    load();
  }, [status, search]);

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>All Orders</h1>
        <p style={C.sub}>Click any order to view details, staff assignments and make adjustments.</p>

        <div style={C.sbar}>
          <div style={{ position:"relative", flex:1, minWidth:"200px" }}>
            <span style={{ position:"absolute", left:".75rem", top:"50%", transform:"translateY(-50%)", fontSize:".85rem" }}>🔍</span>
            <input style={C.sinput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by topic, student name or phone..." />
          </div>
          <select style={C.sel} value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <p style={C.total}>{total} orders found</p>

        {loading ? (
          <div style={{ textAlign:"center", padding:"3rem", color:"#5B7EA6" }}>Loading...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem", color:"#5B7EA6", fontSize:".85rem" }}>No orders found.</div>
        ) : (
          orders.map((o: any) => {
            const writerNames = [...new Set(
              o.chapters?.map((ch: any) => ch.assignedTo?.name).filter(Boolean)
            )] as string[];
            const delivered   = o.chapters?.filter((ch: any) => ch.status === "DELIVERED").length || 0;
            const total       = o.chapters?.length || 0;
            return (
              <div key={o.id} style={C.card} onClick={() => setSelected(o.id)}>
                <div style={C.row}>
                  <div style={{ minWidth:0 }}>
                    <div style={C.rtitle}>{o.topic}</div>
                    <div style={C.rmeta}>{o.client?.name} · {o.client?.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:".78rem", fontWeight:600, color:"#0C1A2E" }}>{o.plan?.planName}</div>
                    <div style={C.rmeta}>{DEG[o.degreeGroup]||o.degreeGroup}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:".78rem", fontWeight:600, color:"#0C1A2E" }}>
                      {writerNames.length > 0 ? writerNames.join(", ") : "Unassigned"}
                    </div>
                    <div style={C.rmeta}>{delivered}/{total} chapters delivered</div>
                  </div>
                  <StatusBadge status={o.status} />
                  <span style={C.chevron}>›</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <OrderDetail
          orderId={selected}
          onClose={() => setSelected(null)}
          staffList={staffList}
        />
      )}
    </AdminLayout>
  );
}

export default function AdminOrders() {
  return (
    <Suspense fallback={<div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:"#5B7EA6" }}>Loading...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
