"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";

const C = {
  page:   { maxWidth:"900px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:    { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  tabs:   { display:"flex", gap:".5rem", marginBottom:"1.5rem" },
  tab:    { padding:".55rem 1.25rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontWeight:700, cursor:"pointer", background:"#fff", color:"#5B7EA6" },
  tabA:   { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  card:   { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden", marginBottom:"1rem" },
  row:    { display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:"1rem", alignItems:"center", padding:"1rem 1.25rem", borderBottom:"1px solid #F0F9FF" },
  title:  { fontFamily:"'Syne',sans-serif", fontSize:".85rem", fontWeight:700, color:"#0C1A2E", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const },
  meta:   { fontSize:".72rem", color:"#5B7EA6", marginTop:"2px" },
  ref:    { fontSize:".72rem", fontFamily:"monospace", color:"#0369A1", fontWeight:700, background:"#E0F2FE", padding:"2px 6px", borderRadius:"4px" },
  amount: { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:800, color:"#0C1A2E", whiteSpace:"nowrap" as const },
  btnG:   { padding:".4rem .9rem", borderRadius:"8px", background:"#D1FAE5", color:"#065F46", fontSize:".75rem", fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap" as const },
  btnR:   { padding:".4rem .9rem", borderRadius:"8px", background:"#FEE2E2", color:"#991B1B", fontSize:".75rem", fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap" as const },
  btnE:   { padding:".4rem .9rem", borderRadius:"8px", background:"#EDE9FE", color:"#5B21B6", fontSize:".75rem", fontWeight:700, border:"none", cursor:"pointer", whiteSpace:"nowrap" as const },
  empty:  { textAlign:"center" as const, padding:"3rem", color:"#5B7EA6", fontSize:".85rem" },
  settBox:{ background:"#F0F9FF", border:"1.5px solid #BAE6FD", borderRadius:"16px", padding:"1.25rem", marginBottom:"1.5rem" },
  settT:  { fontFamily:"'Syne',sans-serif", fontSize:".88rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1rem" },
  grid:   { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:".75rem", marginBottom:"1rem" },
  fg:     { display:"flex", flexDirection:"column" as const, gap:".3rem" },
  lbl:    { fontSize:".62rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6" },
  inp:    { padding:".5rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" as const },
  sel:    { padding:".5rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" as const, background:"#fff" },
  ta:     { padding:".5rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", boxSizing:"border-box" as const, resize:"vertical" as const, minHeight:"70px" },
  btnS:   { padding:".55rem 1.25rem", borderRadius:"10px", background:"#0C1A2E", color:"#38BDF8", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer" },
  // Modal
  overlay:{ position:"fixed" as const, inset:0, background:"rgba(12,26,46,.6)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" },
  modal:  { background:"#fff", borderRadius:"20px", padding:"1.75rem", maxWidth:"520px", width:"100%", maxHeight:"90vh", overflowY:"auto" as const },
  mh1:    { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:800, color:"#0C1A2E", marginBottom:".25rem" },
  msub:   { fontSize:".75rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  chapGrid:{ display:"flex", flexWrap:"wrap" as const, gap:".4rem", marginTop:".4rem" },
  chap:   { padding:".3rem .7rem", borderRadius:"999px", border:"1.5px solid #E0F2FE", fontSize:".75rem", cursor:"pointer", fontWeight:600, background:"#fff", color:"#0C1A2E" },
  chapA:  { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
};

const DEG:Record<string,string> = { OND_HND_NCE:"HND/OND", BSC_BED_BA:"BSc/BEd", PGD_MSC_PHD:"PGD/MSc", PHD:"PhD" };
const DEG_OPTIONS = [
  { value:"OND_HND_NCE", label:"HND / OND / NCE" },
  { value:"BSC_BED_BA",  label:"BSc / BEd / BA"  },
  { value:"PGD_MSC_PHD", label:"PGD / MSc / MBA"  },
  { value:"PHD",         label:"PhD"              },
];

export default function AdminBankTransfers() {
  const [tab,      setTab]      = useState<"pending"|"confirmed"|"addchapters">("pending");
  const [orders,   setOrders]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState<string|null>(null);
  const [account,  setAccount]  = useState<any>(null);
  const [saving,   setSaving]   = useState(false);
  const [acct,     setAcct]     = useState({ accountName:"", accountNumber:"", bankName:"" });
  const [chapterReqs, setChapterReqs] = useState<any[]>([]);
  const [chReqLoading, setChReqLoading] = useState(false);

  // Edit modal state
  const [editOrder,   setEditOrder]   = useState<any|null>(null);
  const [editSaving,       setEditSaving]       = useState(false);
  const [editGuideUploading, setEditGuideUploading] = useState(false);
  const [plans,       setPlans]       = useState<any[]>([]);
  const [editForm,    setEditForm]    = useState({
    topic:"", department:"", degreeGroup:"", planId:"", selectedChapters:[] as number[],
    specialInstructions:"", guidelineFileUrl:"",
  });

  async function loadOrders() {
    setLoading(true);
    const res  = await fetch(`/api/admin/orders?status=${tab==="pending"?"PENDING_PAYMENT":"IN_PROGRESS"}`);
    const data = await res.json();
    if (data.success) {
      const filtered = (data.data.orders || []).filter((o:any) => o.paymentMethod === "BANK_TRANSFER");
      setOrders(filtered);
    }
    setLoading(false);
  }

  async function loadChapterRequests() {
    setChReqLoading(true);
    const res  = await fetch(`/api/admin/pending-chapter-requests?status=${tab==="addchapters"?"PENDING_PAYMENT":"CONFIRMED"}`);
    const data = await res.json();
    if (data.success) setChapterReqs(data.data || []);
    setChReqLoading(false);
  }

  async function loadAccount() {
    const res  = await fetch("/api/admin/bank-account");
    const data = await res.json();
    if (data.success) {
      setAccount(data.data);
      setAcct({ accountName:data.data.accountName||"", accountNumber:data.data.accountNumber||"", bankName:data.data.bankName||"" });
    }
  }

  useEffect(() => { loadAccount(); }, []);
  useEffect(() => {
    if (tab === "addchapters") loadChapterRequests();
    else loadOrders();
  }, [tab]);

  async function confirm(orderId: string) {
    setActing(orderId);
    const res  = await fetch("/api/orders/bank-transfer", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Payment confirmed! Chapters assigned."); loadOrders(); }
    else toast.error(data.error || "Something went wrong");
    setActing(null);
  }

  async function deleteOrder(orderId: string, topic: string) {
    if (!window.confirm(`Delete "${topic}"?\n\nThis permanently removes the order. Use only for unpaid or duplicate orders.`)) return;
    setActing(orderId);
    try {
      const res  = await fetch("/api/admin/orders", {
        method:"DELETE", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) { toast.success("Order deleted."); loadOrders(); }
      else toast.error(data.error || "Something went wrong.");
    } catch { toast.error("Network error. Please try again."); }
    finally { setActing(null); }
  }

  async function confirmChapterRequest(requestId: string) {
    setActing(requestId);
    const res  = await fetch("/api/admin/pending-chapter-requests", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ requestId }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Chapters confirmed and assigned!"); loadChapterRequests(); }
    else toast.error(data.error || "Something went wrong");
    setActing(null);
  }

  async function rejectChapterRequest(requestId: string) {
    setActing(requestId);
    const res  = await fetch("/api/admin/pending-chapter-requests", {
      method:"DELETE", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ requestId }),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Request rejected."); loadChapterRequests(); }
    else toast.error(data.error || "Something went wrong");
    setActing(null);
  }

  async function saveAccount() {
    if (!acct.accountName || !acct.accountNumber || !acct.bankName) {
      toast.error("All fields are required."); return;
    }
    setSaving(true);
    const res  = await fetch("/api/admin/bank-account", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(acct),
    });
    const data = await res.json();
    if (res.ok) { toast.success("Bank account updated!"); loadAccount(); }
    else toast.error(data.error || "Failed to save");
    setSaving(false);
  }

  // Open edit modal — load plans for the order's degree group
  async function openEdit(order: any) {
    // Always use latest from local orders array in case it was already edited
    const latest = orders.find(o => o.id === order.id) || order;
    const degRes  = await fetch(`/api/plans?degreeGroup=${latest.degreeGroup}`);
    const degData = await degRes.json();
    setPlans(degData.success ? degData.data : []);
    setEditForm({
      topic:               latest.topic || "",
      department:          latest.department || "",
      degreeGroup:         latest.degreeGroup || "",
      planId:              latest.planId || latest.chapters?.[0]?.planId || "",
      selectedChapters:    latest.selectedChapters
        ? latest.selectedChapters.split(",").map(Number).filter(Boolean)
        : latest.chapters?.map((ch:any) => ch.chapterNumber).filter(Boolean) || [],
      specialInstructions: latest.specialInstructions || "",
      guidelineFileUrl:    latest.guidelineFileUrl || "",
    });
    setEditOrder(latest);
  }

  async function handleDegreeChange(dg: string) {
    setEditForm(f => ({ ...f, degreeGroup:dg, planId:"", selectedChapters:[] }));
    const res  = await fetch(`/api/plans?degreeGroup=${dg}`);
    const data = await res.json();
    setPlans(data.success ? data.data : []);
  }

  async function saveEdit() {
    if (!editForm.topic.trim() || !editForm.degreeGroup || !editForm.planId) {
      toast.error("Topic, degree level and plan are required."); return;
    }
    setEditSaving(true);
    try {
      const res  = await fetch("/api/admin/orders", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          orderId:             editOrder.id,
          action:              "edit_order",
          topic:               editForm.topic.trim(),
          department:          editForm.department.trim(),
          degreeGroup:         editForm.degreeGroup,
          planId:              editForm.planId,
          selectedChapters:    editForm.selectedChapters.sort().join(","),
          specialInstructions: editForm.specialInstructions.trim() || null,
          guidelineFileUrl:    editForm.guidelineFileUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Order updated successfully.");
        // Update local orders array so reopening edit shows latest values
        setOrders(prev => prev.map(o => o.id === editOrder.id ? {
          ...o,
          topic:               editForm.topic.trim(),
          department:          editForm.department.trim(),
          degreeGroup:         editForm.degreeGroup,
          planId:              editForm.planId,
          selectedChapters:    editForm.selectedChapters.sort().join(","),
          specialInstructions: editForm.specialInstructions.trim() || null,
          guidelineFileUrl:    editForm.guidelineFileUrl.trim() || null,
          amountPaid:          data.amountPaidKobo / 100,
        } : o));
        // Keep modal open with current form state — admin may want to confirm immediately
        setEditOrder(prev => prev ? {...prev,
          topic:               editForm.topic.trim(),
          department:          editForm.department.trim(),
          degreeGroup:         editForm.degreeGroup,
          guidelineFileUrl:    editForm.guidelineFileUrl.trim() || null,
          specialInstructions: editForm.specialInstructions.trim() || null,
        } : null);
      } else {
        toast.error(data.error || "Failed to save changes.");
      }
    } catch { toast.error("Network error. Please try again."); }
    finally { setEditSaving(false); }
  }

  const selectedEditPlan = plans.find(p => p.id === editForm.planId);
  const isPerChapter     = selectedEditPlan?.pricingType === "PER_CHAPTER";

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Bank Transfer Orders</h1>
        <p style={C.sub}>Confirm bank transfer payments and manage your account details.</p>

        {/* Bank account settings */}
        <div style={C.settBox}>
          <div style={C.settT}>🏦 Your Bank Account Details</div>
          <div style={C.grid}>
            <div style={C.fg}>
              <label style={C.lbl}>Account Name</label>
              <input style={C.inp} value={acct.accountName} onChange={e=>setAcct(p=>({...p,accountName:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Account Number</label>
              <input style={C.inp} value={acct.accountNumber} onChange={e=>setAcct(p=>({...p,accountNumber:e.target.value}))} />
            </div>
            <div style={C.fg}>
              <label style={C.lbl}>Bank Name</label>
              <input style={C.inp} value={acct.bankName} onChange={e=>setAcct(p=>({...p,bankName:e.target.value}))} />
            </div>
          </div>
          <button style={C.btnS} disabled={saving} onClick={saveAccount}>
            {saving ? "Saving..." : "💾 Save Account Details"}
          </button>
        </div>

        {/* Tabs */}
        <div style={C.tabs}>
          <button style={{...C.tab,...(tab==="pending"?C.tabA:{})}} onClick={()=>setTab("pending")}>⏳ New Orders Pending</button>
          <button style={{...C.tab,...(tab==="confirmed"?C.tabA:{})}} onClick={()=>setTab("confirmed")}>✅ Confirmed</button>
          <button style={{...C.tab,...(tab==="addchapters"?C.tabA:{})}} onClick={()=>setTab("addchapters")}>📎 Add-Chapter Requests</button>
        </div>

        {tab === "addchapters" ? (
          chReqLoading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
          : chapterReqs.length===0 ? <div style={C.empty}>No add-chapter requests.</div>
          : (
            <div style={C.card}>
              {chapterReqs.map((r:any) => (
                <div key={r.id} style={C.row}>
                  <div style={{minWidth:0}}>
                    <div style={C.title}>{r.order?.topic}</div>
                    <div style={C.meta}>{r.order?.client?.name} · {r.order?.client?.phone}</div>
                    <div style={C.meta}>{DEG[r.order?.degreeGroup]||r.order?.degreeGroup} · Chapter(s) {r.chapterNumbers.split(",").join(", ")}</div>
                    <div style={{marginTop:"4px"}}><span style={C.ref}>{r.reference}</span></div>
                  </div>
                  <div>
                    <div style={C.amount}>₦{(r.amountKobo/100).toLocaleString()}</div>
                    <div style={C.meta}>{new Date(r.createdAt).toLocaleDateString("en-NG")}</div>
                  </div>
                  {r.status === "PENDING_PAYMENT" ? (
                    <div style={{display:"flex",flexDirection:"column" as const,gap:".4rem"}}>
                      <button style={C.btnG} disabled={acting===r.id} onClick={()=>confirmChapterRequest(r.id)}>
                        {acting===r.id ? "Confirming..." : "✓ Confirm & Assign"}
                      </button>
                      <button style={C.btnR} disabled={acting===r.id} onClick={()=>rejectChapterRequest(r.id)}>✕ Reject</button>
                    </div>
                  ) : (
                    <span style={{fontSize:".75rem",color:"#065F46",fontWeight:700}}>✅ Confirmed</span>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
          : orders.length===0 ? <div style={C.empty}>No {tab} bank transfer orders.</div>
          : (
            <div style={C.card}>
              {orders.map((o:any) => (
                <div key={o.id} style={C.row}>
                  <div style={{minWidth:0}}>
                    <div style={C.title}>{o.topic}</div>
                    <div style={C.meta}>{o.client?.name} · {o.client?.phone}</div>
                    <div style={C.meta}>{DEG[o.degreeGroup]||o.degreeGroup} · {o.planName}</div>
                    {o.bankTransferReference && (
                      <div style={{marginTop:"4px"}}><span style={C.ref}>{o.bankTransferReference}</span></div>
                    )}
                  </div>
                  <div>
                    <div style={C.amount}>₦{(o.amountPaid||0).toLocaleString()}</div>
                    <div style={C.meta}>{o.paidAt ? new Date(o.paidAt).toLocaleDateString("en-NG") : "Not paid yet"}</div>
                  </div>
                  {tab === "pending" ? (
                    <div style={{display:"flex",flexDirection:"column" as const,gap:".4rem",alignItems:"flex-end"}}>
                      <button style={C.btnG} disabled={acting===o.id} onClick={()=>confirm(o.id)}>
                        {acting===o.id ? "Confirming..." : "✓ Confirm Payment"}
                      </button>
                      <button style={C.btnE} disabled={acting===o.id} onClick={()=>openEdit(o)}>
                        ✏️ Edit Order
                      </button>
                      <button style={C.btnR} disabled={acting===o.id} onClick={()=>deleteOrder(o.id, o.topic)}>
                        🗑 Delete Order
                      </button>
                    </div>
                  ) : (
                    <span style={{fontSize:".75rem",color:"#065F46",fontWeight:700}}>✅ Confirmed</span>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Edit Order Modal */}
      {editOrder && (
        <div style={C.overlay} onClick={e => { if (e.target === e.currentTarget) setEditOrder(null); }}>
          <div style={C.modal}>
            <div style={C.mh1}>✏️ Edit Order Before Confirming</div>
            <div style={C.msub}>
              Fix any mistakes the student made. Changes are saved to the database before payment is confirmed.
            </div>

            <div style={{display:"flex",flexDirection:"column" as const,gap:".85rem"}}>
              {/* Topic */}
              <div style={C.fg}>
                <label style={C.lbl}>Project Topic</label>
                <textarea style={C.ta} value={editForm.topic}
                  onChange={e=>setEditForm(f=>({...f,topic:e.target.value}))} />
              </div>

              {/* Department */}
              <div style={C.fg}>
                <label style={C.lbl}>Department / Course</label>
                <input style={C.inp} value={editForm.department}
                  onChange={e=>setEditForm(f=>({...f,department:e.target.value}))}
                  placeholder="e.g. Business Administration" />
              </div>

              {/* Degree group */}
              <div style={C.fg}>
                <label style={C.lbl}>Degree Level</label>
                <select style={C.sel} value={editForm.degreeGroup}
                  onChange={e=>handleDegreeChange(e.target.value)}>
                  <option value="">Select degree...</option>
                  {DEG_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              {/* Plan */}
              {plans.length > 0 && (
                <div style={C.fg}>
                  <label style={C.lbl}>Plan</label>
                  <select style={C.sel} value={editForm.planId}
                    onChange={e=>setEditForm(f=>({...f,planId:e.target.value,selectedChapters:[]}))}>
                    <option value="">Select plan...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.planName} — ₦{(p.priceKobo/100).toLocaleString()}{p.pricingType==="PER_CHAPTER"?"/ch":" flat"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chapter selection (per-chapter plans only) */}
              {isPerChapter && editForm.planId && (
                <div style={C.fg}>
                  <label style={C.lbl}>Chapters Selected</label>
                  <div style={C.chapGrid}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button"
                        style={{...C.chap,...(editForm.selectedChapters.includes(n)?C.chapA:{})}}
                        onClick={()=>setEditForm(f=>({
                          ...f,
                          selectedChapters: f.selectedChapters.includes(n)
                            ? f.selectedChapters.filter(c=>c!==n)
                            : [...f.selectedChapters,n].sort()
                        }))}>
                        Ch {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Special instructions */}
              <div style={C.fg}>
                <label style={C.lbl}>Special Instructions <span style={{fontWeight:400,textTransform:"none" as const,color:"#94A3B8"}}>(optional)</span></label>
                <textarea style={C.ta} value={editForm.specialInstructions}
                  onChange={e=>setEditForm(f=>({...f,specialInstructions:e.target.value}))}
                  placeholder="Any specific instructions for the writer..." />
              </div>

              {/* Guideline files */}
              <div style={C.fg}>
                <label style={C.lbl}>Guideline / School Format Files</label>

                {/* Show existing files */}
                {editForm.guidelineFileUrl && editForm.guidelineFileUrl.split(",").filter(Boolean).map((url:string, i:number, arr:string[]) => (
                  <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:"8px",padding:".4rem .75rem",marginBottom:".4rem",fontSize:".78rem"}}>
                    <a href={`/api/download/guideline?url=${encodeURIComponent(url.trim())}&label=file`} target="_blank" rel="noreferrer"
                      style={{color:"#065F46",fontWeight:600,textDecoration:"none"}}>
                      📎 Guideline {arr.length > 1 ? i + 1 : "File"}
                    </a>
                    <button type="button" onClick={() => {
                      const updated = arr.filter((_:string, j:number) => j !== i).join(",");
                      setEditForm(f => ({...f, guidelineFileUrl: updated}));
                    }} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:".85rem"}}>✕</button>
                  </div>
                ))}

                {/* Upload more files */}
                {(!editForm.guidelineFileUrl || editForm.guidelineFileUrl.split(",").filter(Boolean).length < 5) && (
                  <div
                    style={{border:"2px dashed #BAE6FD",borderRadius:"10px",padding:".85rem",textAlign:"center" as const,cursor:editGuideUploading?"not-allowed":"pointer",background:"#F8FCFF",fontSize:".78rem",color:"#5B7EA6"}}
                    onClick={()=>{
                      if (editGuideUploading) return;
                      const inp = document.createElement("input");
                      inp.type = "file";
                      inp.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.mp3,.m4a,.wav,.zip";
                      inp.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        if (file.size > 20 * 1024 * 1024) { toast.error("Max 20MB per file."); return; }
                        setEditGuideUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          fd.append("folder", "orders/guidelines");
                          const res  = await fetch("/api/admin/upload", { method:"POST", body:fd });
                          const data = await res.json();
                          if (res.ok) {
                            setEditForm(f => {
                              const existing = f.guidelineFileUrl ? f.guidelineFileUrl.split(",").filter(Boolean) : [];
                              return {...f, guidelineFileUrl: [...existing, data.url].join(",")};
                            });
                            toast.success("File uploaded.");
                          } else toast.error(data.error || "Upload failed.");
                        } catch { toast.error("Upload failed. Please try again."); }
                        finally { setEditGuideUploading(false); }
                      };
                      inp.click();
                    }}>
                    {editGuideUploading ? "⏳ Uploading..." : "📎 Click to upload guideline file · PDF, Word, images · Max 20MB"}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{display:"flex",gap:".6rem",marginTop:".5rem"}}>
                <button disabled={editSaving} onClick={saveEdit}
                  style={{...C.btnS,flex:1,padding:".7rem",...(editSaving?{opacity:.6,cursor:"not-allowed" as const}:{})}}>
                  {editSaving ? "Saving..." : "💾 Save Changes"}
                </button>
                <button onClick={()=>setEditOrder(null)}
                  style={{padding:".7rem 1.25rem",borderRadius:"10px",border:"1.5px solid #BAE6FD",background:"#fff",cursor:"pointer",fontWeight:700,color:"#5B7EA6",fontSize:".82rem"}}>
                  Cancel
                </button>
              </div>

              <p style={{fontSize:".72rem",color:"#5B7EA6",textAlign:"center" as const}}>
                After saving, go back and click ✓ Confirm Payment to activate the order.
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
