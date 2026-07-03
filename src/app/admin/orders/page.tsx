"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";

const STATUSES = [
  { value:"all",              label:"All Statuses" },
  { value:"IN_PROGRESS",     label:"In Progress" },
  { value:"DELIVERED",       label:"Delivered (Full or Partial)" },
  { value:"FULLY_DELIVERED", label:"Fully Completed" },
  { value:"PENDING_PAYMENT", label:"Pending Payment" },
  { value:"CANCELLED",       label:"Cancelled" },
];

const STATUS_COLORS:Record<string,React.CSSProperties> = {
  DELIVERED:       { background:"#D1FAE5", color:"#065F46" },
  QC_IN_PROGRESS:  { background:"#EDE9FE", color:"#5B21B6" },
  IN_PROGRESS:     { background:"#FEF9C3", color:"#854D0E" },
  NOT_STARTED:     { background:"#F1F5F9", color:"#64748B" },
  PENDING_PAYMENT: { background:"#F1F5F9", color:"#64748B" },
  CANCELLED:       { background:"#FEE2E2", color:"#991B1B" },
  SUBMITTED:       { background:"#E0F2FE", color:"#0369A1" },
  QC_DONE:         { background:"#D1FAE5", color:"#065F46" },
};

const C = {
  page:     { maxWidth:"1200px", margin:"0 auto" },
  h1:       { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:      { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  sbar:     { display:"flex", gap:".75rem", marginBottom:"1rem", flexWrap:"wrap" as const },
  sinput:   { flex:1, minWidth:"200px", padding:".65rem 1rem .65rem 2.2rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  sel:      { padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  total:    { fontSize:".78rem", color:"#5B7EA6", marginBottom:".75rem" },
  card:     { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden", marginBottom:".5rem", cursor:"pointer" },
  row:      { display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr auto auto", gap:"1rem", alignItems:"center", padding:".85rem 1.25rem" },
  rtitle:   { fontFamily:"'Syne',sans-serif", fontSize:".85rem", fontWeight:700, color:"#0C1A2E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const },
  rmeta:    { fontSize:".72rem", color:"#5B7EA6", marginTop:"2px" },
  badge:    { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700, whiteSpace:"nowrap" as const },
  chevron:  { color:"#5B7EA6", fontSize:"1.1rem", fontWeight:700 },
  // Detail panel
  panel:    { position:"fixed" as const, top:0, right:0, width:"500px", height:"100vh", background:"#fff", borderLeft:"1.5px solid #E0F2FE", boxShadow:"-8px 0 32px rgba(0,0,0,.1)", zIndex:40, overflowY:"auto" as const, padding:"1.5rem" },
  overlay:  { position:"fixed" as const, inset:0, background:"rgba(12,26,46,.4)", zIndex:39 },
  ph:       { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem" },
  ptitle:   { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:800, color:"#0C1A2E" },
  pclose:   { background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#5B7EA6" },
  sect:     { marginBottom:"1.25rem" },
  sl:       { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", marginBottom:".6rem", display:"block" },
  infoBox:  { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".85rem 1rem" },
  irow:     { display:"flex", justifyContent:"space-between", fontSize:".8rem", marginBottom:".3rem", gap:"1rem" },
  ilbl:     { color:"#5B7EA6", flexShrink:0 },
  ival:     { fontWeight:600, color:"#0C1A2E", textAlign:"right" as const },
  chCard:   { border:"1.5px solid #E0F2FE", borderRadius:"12px", padding:".85rem 1rem", marginBottom:".5rem" },
  chHead:   { display:"flex", alignItems:"center", gap:".75rem", marginBottom:".5rem" },
  chNum:    { width:"30px", height:"30px", borderRadius:"8px", background:"#E0F2FE", color:"#0369A1", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".75rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  chNumD:   { width:"30px", height:"30px", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".75rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  chInfo:   { flex:1 },
  chTitle:  { fontSize:".85rem", fontWeight:700, color:"#0C1A2E" },
  chStaff:  { fontSize:".72rem", color:"#5B7EA6", marginTop:"2px" },
  chBtns:   { display:"flex", gap:".4rem", marginTop:".5rem", flexWrap:"wrap" as const },
  btnSm:    { padding:".3rem .75rem", borderRadius:"7px", fontSize:".7rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnB:     { background:"#E0F2FE", color:"#0369A1" },
  btnR:     { background:"#FEE2E2", color:"#991B1B" },
  btnG:     { background:"#D1FAE5", color:"#065F46" },
  stuBox:   { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".82rem", color:"#0C1A2E", lineHeight:1.5 },
  adjBox:   { background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:"10px", padding:".85rem 1rem", marginBottom:"1rem" },
  adjT:     { fontSize:".72rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#9A3412", marginBottom:".6rem" },
  ta:       { width:"100%", padding:".6rem .9rem", borderRadius:"8px", border:"1px solid #FED7AA", fontSize:".8rem", fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" as const, minHeight:"60px", boxSizing:"border-box" as const, background:"#fff" },
  btnSave:  { marginTop:".5rem", padding:".45rem 1rem", borderRadius:"8px", background:"#38BDF8", color:"#0C1A2E", fontSize:".78rem", fontWeight:700, border:"none", cursor:"pointer" },
  staffSel: { width:"100%", padding:".55rem .9rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".8rem", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"#fff", marginBottom:".4rem", boxSizing:"border-box" as const },
  dlBtn:    { fontSize:".72rem", color:"#0369A1", fontWeight:600, background:"none", border:"none", cursor:"pointer", textDecoration:"underline" },
  orderBtns:{ display:"flex", gap:".5rem", flexWrap:"wrap" as const },
};

const DEG:Record<string,string> = { OND_HND_NCE:"HND/OND", BSC_BED_BA:"BSc/BEd", PGD_MSC_PHD:"PGD/MSc" };

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || { background:"#F1F5F9", color:"#64748B" };
  return <span style={{ ...C.badge, ...s }}>{(status||"").replace(/_/g," ")}</span>;
}

function OrderDetail({ orderId, onClose, writerList, analystList, qcList }: { orderId:string, onClose:()=>void, writerList:any[], analystList:any[], qcList:any[] }) {
  const [order,    setOrder]    = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [note,     setNote]     = useState("");
  const [saving,   setSaving]   = useState<string|null>(null);
  const [reassign, setReassign] = useState<string|null>(null);
  const [newStaff, setNewStaff] = useState("");
  const [reassignQc, setReassignQc] = useState<string|null>(null);
  const [newQcStaff, setNewQcStaff] = useState("");
  const [uploadingGuide, setUploadingGuide] = useState(false);

  async function uploadGuideline(file: File) {
    setUploadingGuide(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Use dedicated admin upload endpoint — no folder restriction issues
      const res  = await fetch("/api/admin/upload", { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Upload failed."); return; }
      const existing = order?.guidelineFileUrl ? order.guidelineFileUrl.split(",").map((u:string) => u.trim()).filter(Boolean) : [];
      const updated  = [...existing, data.url].join(",");
      const saveRes  = await fetch("/api/admin/orders", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ orderId, action:"update_guideline", guidelineFileUrl: updated }),
      });
      const saveData = await saveRes.json();
      if (saveRes.ok) { toast.success("Guideline uploaded and saved."); load(); }
      else toast.error(saveData.error || "Failed to save.");
    } catch { toast.error("Upload failed — please try again."); }
    finally { setUploadingGuide(false); }
  }

  function triggerGuidelineUpload() {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip";
    inp.onchange = (e) => { const f=(e.target as HTMLInputElement).files?.[0]; if(f) uploadGuideline(f); };
    inp.click();
  }

  async function load() {
    setLoading(true);
    const res  = await fetch(`/api/admin/orders?orderId=${orderId}`);
    const data = await res.json();
    if (data.success) {
      setOrder(data.data);
      setNote((data.data as any).adminNote || "");
    }
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
    if (res.ok) { toast.success(data.message); load(); }
    else toast.error(data.error || "Something went wrong");
    setSaving(null);
    setReassign(null);
    setNewStaff("");
    setReassignQc(null);
    setNewQcStaff("");
  }

  if (loading) return (
    <>
      <div style={C.overlay} onClick={onClose} />
      <div style={C.panel}>
        <div style={{ textAlign:"center", padding:"3rem", color:"#5B7EA6" }}>Loading...</div>
      </div>
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

        {/* Student info */}
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
              { label:"Level",       val:DEG[order.degreeGroup]||order.degreeGroup||"—" },
              { label:"Plan",        val:order.plan?.planName },
              { label:"Amount Paid", val:`₦${((order.amountPaidKobo||0)/100).toLocaleString()}` },
              { label:"Status",      val:<StatusBadge status={order.status}/> },
              { label:"Paid At",     val:order.paidAt ? new Date(order.paidAt).toLocaleDateString("en-NG") : "—" },
            ].map(r => (
              <div key={r.label} style={C.irow}>
                <span style={C.ilbl}>{r.label}</span>
                <span style={C.ival}>{r.val as any}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Student's original instructions — read only */}
        {order.specialInstructions && (
          <div style={C.sect}>
            <span style={C.sl}>Student's Original Instructions</span>
            <div style={C.stuBox}>{order.specialInstructions}</div>
          </div>
        )}

        {/* Student's uploaded guideline files */}
        <div style={C.sect}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".5rem"}}>
            <span style={C.sl}>Student's Uploaded Guideline{order.guidelineFileUrl && order.guidelineFileUrl.split(",").length>1?"s":""}</span>
            <button
              disabled={uploadingGuide}
              onClick={triggerGuidelineUpload}
              style={{padding:".35rem .75rem",borderRadius:"8px",background:"#F0F9FF",border:"1.5px solid #BAE6FD",color:"#0369A1",fontSize:".72rem",fontWeight:700,cursor:"pointer"}}>
              {uploadingGuide ? "Uploading..." : "＋ Add File"}
            </button>
          </div>
          {order.guidelineFileUrl ? (
            <div style={{display:"flex",flexDirection:"column" as const,gap:".4rem"}}>
              {order.guidelineFileUrl.split(",").map((u:string,i:number,arr:string[]) => (
                <a key={i}
                  href={`/api/download/guideline?url=${encodeURIComponent(u.trim())}&label=${encodeURIComponent(`Guideline ${i+1} ${order.topic}`)}`}
                  target="_blank" rel="noreferrer"
                  style={{display:"inline-flex",alignItems:"center",gap:".4rem",fontSize:".8rem",fontWeight:600,color:"#0369A1",textDecoration:"none"}}>
                  📎 {arr.length>1?`Guideline ${i+1}`:"Download Guideline"}
                </a>
              ))}
            </div>
          ) : (
            <p style={{fontSize:".78rem",color:"#5B7EA6",fontStyle:"italic"}}>No guideline uploaded by student — use the button above to add one.</p>
          )}
        </div>

        {/* Chapters */}
        <div style={C.sect}>
          <span style={C.sl}>Chapters ({order.chapters?.length})</span>
          {order.chapters?.map((ch: any) => (
            <div key={ch.id} style={{...C.chCard, ...(ch.isUrgent ? {border:"1.5px solid #FCA5A5",background:"#FEF2F2"} : {})}}>
              <div style={C.chHead}>
                <div style={ch.status==="DELIVERED" ? C.chNumD : C.chNum}>{ch.chapterNumber}</div>
                <div style={C.chInfo}>
                  <div style={C.chTitle}>
                    {ch.chapterLabel}
                    {ch.isUrgent && <span style={{marginLeft:".5rem",fontSize:".65rem",fontWeight:800,color:"#991B1B",background:"#FEE2E2",padding:"1px 8px",borderRadius:"999px"}}>🚨 URGENT</span>}
                  </div>
                  <div style={C.chStaff}>
                    {ch.assignedTo
                      ? `${ch.assignedTo.name} (${ch.assignedTo.role})`
                      : ch.qcName
                        ? `QC: ${ch.qcName}`
                        : "Unassigned"}
                    {ch.assignedTo && ch.routedToQcId && ch.qcName ? ` → QC: ${ch.qcName}` : ""}
                  </div>
                </div>
                <StatusBadge status={ch.status} />
              </div>

              {ch.correctionNotes && (
                <div style={{background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:"10px",padding:".75rem 1rem",marginBottom:".75rem",fontSize:".78rem",color:"#92400E"}}>
                  <strong>📝 Correction Request:</strong>
                  <div style={{marginTop:".3rem",lineHeight:1.5}}>{ch.correctionNotes}</div>
                  {!ch.routedToQcId && <div style={{marginTop:".4rem",fontSize:".7rem",fontWeight:700,color:"#9A3412"}}>⏳ Awaiting QC pickup — not yet claimed by any QC staff</div>}
                  {ch.routedToQcId && ch.qcName && <div style={{marginTop:".4rem",fontSize:".7rem",fontWeight:700,color:"#065F46"}}>👤 Being handled by: {ch.qcName}</div>}
                </div>
              )}

              <div style={{ display:"flex", gap:"1rem", marginBottom:".5rem" }}>
                {ch.submittedFileUrl && (
                  <a href={`/api/download?chapterId=${ch.id}`} target="_blank" rel="noreferrer" style={C.dlBtn}>📄 Submitted</a>
                )}
                {ch.deliveredFileUrl && (
                  <a href={`/api/download?chapterId=${ch.id}`} target="_blank" rel="noreferrer" style={C.dlBtn}>✅ Delivered</a>
                )}
              </div>

              <div style={C.chBtns}>
                <button style={{ ...C.btnSm, ...C.btnB }}
                  onClick={() => setReassign(reassign===ch.id ? null : ch.id)}>
                  👤 Reassign
                </button>
                {ch.status === "QC_IN_PROGRESS" && (
                  <button style={{ ...C.btnSm, background:"#EDE9FE", color:"#5B21B6" }}
                    onClick={() => setReassignQc(reassignQc===ch.id ? null : ch.id)}>
                    🔍 Reassign QC
                  </button>
                )}
                {["IN_PROGRESS","NOT_STARTED"].includes(ch.status) && (
                  <button style={{ ...C.btnSm, ...C.btnR }}
                    disabled={saving==="reset_chapter"+ch.id}
                    onClick={() => act("reset_chapter", { chapterId:ch.id })}>
                    🔄 Reset
                  </button>
                )}
                {!["DELIVERED","QC_DONE"].includes(ch.status) && (
                  ch.isUrgent ? (
                    <button style={{ ...C.btnSm, background:"#F1F5F9", color:"#64748B" }}
                      disabled={saving==="unmark_urgent"+ch.id}
                      onClick={() => act("unmark_urgent", { chapterId:ch.id })}>
                      {saving==="unmark_urgent"+ch.id ? "..." : "Remove Urgent"}
                    </button>
                  ) : (
                    <button style={{ ...C.btnSm, background:"#FEE2E2", color:"#991B1B" }}
                      disabled={saving==="mark_urgent"+ch.id}
                      onClick={() => act("mark_urgent", { chapterId:ch.id })}>
                      {saving==="mark_urgent"+ch.id ? "..." : "🚨 Mark Urgent"}
                    </button>
                  )
                )}
              </div>

              {reassign === ch.id && (
                <div style={{ marginTop:".6rem", paddingTop:".6rem", borderTop:"1px dashed #BAE6FD" }}>
                  <select style={C.staffSel} value={newStaff} onChange={e => setNewStaff(e.target.value)}>
                    <option value="">-- Select {ch.assigneeRole === "ANALYST" ? "Analyst" : "Writer"} --</option>
                    {(ch.assigneeRole === "ANALYST" ? analystList : writerList).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button style={{ ...C.btnSm, ...C.btnG }}
                    disabled={!newStaff || saving==="reassign_chapter"+ch.id}
                    onClick={() => act("reassign_chapter", { chapterId:ch.id, staffId:newStaff })}>
                    {saving==="reassign_chapter"+ch.id ? "Saving..." : "Confirm Reassign"}
                  </button>
                </div>
              )}

              {reassignQc === ch.id && (
                <div style={{ marginTop:".6rem", paddingTop:".6rem", borderTop:"1px dashed #DDD6FE" }}>
                  <p style={{fontSize:".7rem",color:"#5B21B6",marginBottom:".4rem"}}>
                    Currently with: {ch.qcName || "Unclaimed"}. Reassigning resets it to that QC's Pending tab.
                  </p>
                  <select style={C.staffSel} value={newQcStaff} onChange={e => setNewQcStaff(e.target.value)}>
                    <option value="">-- Select QC staff --</option>
                    {qcList.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button style={{ ...C.btnSm, background:"#5B21B6", color:"#fff" }}
                    disabled={!newQcStaff || saving==="reassign_qc"+ch.id}
                    onClick={() => act("reassign_qc", { chapterId:ch.id, staffId:newQcStaff })}>
                    {saving==="reassign_qc"+ch.id ? "Saving..." : "Confirm QC Reassign"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Admin note — separate from student instructions */}
        <div style={C.adjBox}>
          <div style={C.adjT}>Admin Note (visible to staff, not student)</div>
          <textarea style={C.ta} rows={3} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Internal note for staff — e.g. This work is urgent. Deliver by Friday." />
          <button style={C.btnSave} disabled={saving==="add_note"}
            onClick={() => act("add_note", { notes: note })}>
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
                onClick={() => { toast((t) => (<span style={{display:"flex",alignItems:"center",gap:"1rem",fontSize:".82rem"}}><span>Mark entire order as delivered?</span><button style={{background:"#D1FAE5",color:"#065F46",border:"none",padding:"4px 10px",borderRadius:"6px",cursor:"pointer",fontWeight:700}} onClick={()=>{toast.dismiss(t.id);act("mark_delivered");}}>Yes</button><button style={{background:"#F1F5F9",border:"none",padding:"4px 10px",borderRadius:"6px",cursor:"pointer"}} onClick={()=>toast.dismiss(t.id)}>No</button></span>), {duration:10000}); }}>
                ✅ Mark Delivered
              </button>
            )}
            {order.status !== "CANCELLED" && (
              <button style={{ ...C.btnSm, ...C.btnR, padding:".5rem 1rem" }}
                disabled={saving==="cancel"}
                onClick={() => { toast((t) => (<span style={{display:"flex",alignItems:"center",gap:"1rem",fontSize:".82rem"}}><span>Cancel this order? Cannot be undone.</span><button style={{background:"#FEE2E2",color:"#991B1B",border:"none",padding:"4px 10px",borderRadius:"6px",cursor:"pointer",fontWeight:700}} onClick={()=>{toast.dismiss(t.id);act("cancel");}}>Yes, Cancel</button><button style={{background:"#F1F5F9",border:"none",padding:"4px 10px",borderRadius:"6px",cursor:"pointer"}} onClick={()=>toast.dismiss(t.id)}>No</button></span>), {duration:10000}); }}>
                ✕ Cancel Order
              </button>
            )}
            {["PENDING_PAYMENT","CANCELLED"].includes(order.status) && (
              <button style={{ ...C.btnSm, background:"#7F1D1D", color:"#fff", padding:".5rem 1rem" }}
                disabled={saving==="delete_order"}
                onClick={async () => {
                  if (!window.confirm(`Permanently delete "${order.topic}"?\n\nThis removes the order and all related data. Use only for unpaid or duplicate orders.`)) return;
                  setSaving("delete_order");
                  const res  = await fetch("/api/admin/orders", {
                    method:"DELETE", headers:{"Content-Type":"application/json"},
                    body: JSON.stringify({ orderId: order.id }),
                  });
                  const data = await res.json();
                  if (res.ok) { toast.success("Order deleted."); onClose(); }
                  else toast.error(data.error || "Something went wrong.");
                  setSaving(null);
                }}>
                {saving==="delete_order" ? "Deleting..." : "🗑 Delete Order"}
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
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [search,   setSearch]   = useState(searchParams.get("search")||"");
  const [status,   setStatus]   = useState(searchParams.get("status")||"all");
  const [selected, setSelected] = useState<string|null>(null);
  const [writerList,  setWriterList]  = useState<any[]>([]);
  const [analystList, setAnalystList] = useState<any[]>([]);
  const [qcList,      setQcList]      = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/staff?role=WRITER&filter=active").then(r=>r.json()),
      fetch("/api/admin/staff?role=ANALYST&filter=active").then(r=>r.json()),
      fetch("/api/admin/staff?role=QC&filter=active").then(r=>r.json()),
    ]).then(([w, a, q]) => {
      if (w.success) setWriterList(w.data || []);
      if (a.success) setAnalystList(a.data || []);
      if (q.success) setQcList(q.data || []);
    });
  }, []);

  useEffect(() => { setPage(1); }, [status, search]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res  = await fetch(`/api/admin/orders?status=${status}&search=${encodeURIComponent(search)}&page=${page}`);
      const data = await res.json();
      if (data.success) { setOrders(data.data.orders); setTotal(data.data.total); setPages(data.data.pages || 1); }
      setLoading(false);
    }
    load();
  }, [status, search, page]);

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>All Orders</h1>
        <p style={C.sub}>Click any order to view details, staff assignments and make adjustments.</p>

        <div style={C.sbar}>
          <div style={{ position:"relative", flex:1, minWidth:"200px" }}>
            <span style={{ position:"absolute", left:".75rem", top:"50%", transform:"translateY(-50%)", fontSize:".85rem" }}>🔍</span>
            <input style={C.sinput} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by topic, student name or phone..." />
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
          <>
            {orders.map((o: any) => {
              const writerNames = [...new Set(
                o.chapters?.map((ch: any) => ch.assignedTo?.name).filter(Boolean)
              )] as string[];
              const qcNames = [...new Set(
                o.chapters?.map((ch: any) => !ch.assignedTo && ch.qcName ? `QC: ${ch.qcName}` : null).filter(Boolean)
              )] as string[];
              const staffDisplay = writerNames.length > 0
                ? writerNames.join(", ")
                : qcNames.length > 0
                  ? qcNames.join(", ")
                  : "Unassigned";
              const delivered = o.chapters?.filter((ch: any) => ch.status === "DELIVERED").length || 0;
              const total     = o.chapters?.length || 0;
              return (
                <div key={o.id} style={C.card} onClick={() => setSelected(o.id)}>
                  <div style={C.row}>
                    <div style={{ minWidth:0 }}>
                      <div style={C.rtitle}>{o.topic}</div>
                      <div style={C.rmeta}>{o.client?.name} · {o.client?.phone}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:".78rem", fontWeight:600, color:"#0C1A2E" }}>{o.plan?.planName}</div>
                      <div style={C.rmeta}>{DEG[o.degreeGroup]||o.degreeGroup||"—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:".78rem", fontWeight:600, color:"#0C1A2E" }}>
                        {staffDisplay}
                      </div>
                      <div style={C.rmeta}>{delivered}/{total} chapters delivered</div>
                    </div>
                    <StatusBadge status={(o.status||"")} />
                    <span style={C.chevron}>›</span>
                  </div>
                </div>
              );
            })}
            {/* Pagination */}
            {pages > 1 && (
              <div style={{display:"flex",gap:".5rem",justifyContent:"center",marginTop:"1.5rem",flexWrap:"wrap" as const}}>
                <button style={{padding:".4rem .9rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",fontSize:".8rem",fontWeight:700,cursor:page===1?"not-allowed":"pointer",opacity:page===1?.4:1,background:"#fff",color:"#0C1A2E"}}
                  disabled={page===1} onClick={()=>setPage((p:number)=>p-1)}>← Prev</button>
                {Array.from({length:pages},(_,i)=>i+1).map((p:number)=>(
                  <button key={p} style={{padding:".4rem .9rem",borderRadius:"8px",fontSize:".8rem",fontWeight:700,cursor:"pointer",border:"1.5px solid",
                    background:p===page?"#0C1A2E":"#fff",color:p===page?"#38BDF8":"#0C1A2E",borderColor:p===page?"#0C1A2E":"#BAE6FD"}}
                    onClick={()=>setPage(p)}>{p}</button>
                ))}
                <button style={{padding:".4rem .9rem",borderRadius:"8px",border:"1.5px solid #BAE6FD",fontSize:".8rem",fontWeight:700,cursor:page===pages?"not-allowed":"pointer",opacity:page===pages?.4:1,background:"#fff",color:"#0C1A2E"}}
                  disabled={page===pages} onClick={()=>setPage((p:number)=>p+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {selected && (
        <OrderDetail
          orderId={selected}
          onClose={() => setSelected(null)}
          writerList={writerList}
          analystList={analystList}
          qcList={qcList}
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
