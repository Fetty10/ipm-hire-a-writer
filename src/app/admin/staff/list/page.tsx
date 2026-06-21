"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const C = {
  page:  { maxWidth:"1100px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  sbar:  { display:"flex", gap:".75rem", marginBottom:"1rem", flexWrap:"wrap" as const },
  sinput:{ flex:1, minWidth:"180px", padding:".65rem 1rem .65rem 2.2rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  sel:   { padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden" },
  table: { width:"100%", borderCollapse:"collapse" as const, fontSize:".78rem" },
  th:    { textAlign:"left" as const, padding:".6rem 1rem", fontSize:".6rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#5B7EA6", borderBottom:"1px solid #E0F2FE", whiteSpace:"nowrap" as const, background:"#F8FBFF" },
  td:    { padding:".65rem 1rem", borderBottom:"1px solid #F0F9FF", color:"#0C1A2E", verticalAlign:"middle" as const },
  row:   { cursor:"pointer", transition:"background .15s" },
  badge: { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700 },
  btnY:  { padding:".35rem .75rem", borderRadius:"8px", background:"#FEF9C3", color:"#854D0E", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnG:  { padding:".35rem .75rem", borderRadius:"8px", background:"#D1FAE5", color:"#065F46", fontSize:".72rem", fontWeight:700, border:"none", cursor:"pointer" },
  modal: { position:"fixed" as const, inset:0, background:"rgba(12,26,46,.6)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" },
  mCard: { background:"#fff", borderRadius:"20px", padding:"1.5rem", maxWidth:"420px", width:"100%" },
  mTitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:700, color:"#0C1A2E", marginBottom:".5rem" },
  mSub:  { fontSize:".82rem", color:"#5B7EA6", marginBottom:"1rem" },
  ta:    { width:"100%", padding:".65rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", fontFamily:"'DM Sans',sans-serif", outline:"none", marginBottom:"1rem", resize:"vertical" as const, minHeight:"60px", boxSizing:"border-box" as const },
  mbtns: { display:"flex", gap:".5rem" },
  btnR:  { padding:".55rem 1.1rem", borderRadius:"10px", background:"#FEE2E2", color:"#991B1B", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer" },
  btnN:  { padding:".55rem 1.1rem", borderRadius:"10px", background:"#F1F5F9", color:"#64748B", fontSize:".82rem", fontWeight:700, border:"none", cursor:"pointer" },
  empty: { textAlign:"center" as const, padding:"3rem", color:"#5B7EA6", fontSize:".82rem" },

  // Drawer
  overlay:{ position:"fixed" as const, inset:0, background:"rgba(12,26,46,.6)", zIndex:60 },
  drawer: { position:"fixed" as const, top:0, right:0, height:"100vh", width:"100%", maxWidth:"560px", background:"#F8FBFF", zIndex:61, overflowY:"auto" as const, boxShadow:"-10px 0 40px rgba(0,0,0,.2)" },
  dHead:  { padding:"1.5rem", background:"#fff", borderBottom:"1px solid #E0F2FE", display:"flex", justifyContent:"space-between", alignItems:"flex-start" },
  dName:  { fontFamily:"'Syne',sans-serif", fontSize:"1.3rem", fontWeight:800, color:"#0C1A2E" },
  dMeta:  { fontSize:".78rem", color:"#5B7EA6", marginTop:".2rem" },
  dClose: { background:"none", border:"none", fontSize:"1.5rem", cursor:"pointer", color:"#5B7EA6" },
  dBody:  { padding:"1.5rem" },
  section:{ background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem", marginBottom:"1rem" },
  sTitle: { fontFamily:"'Syne',sans-serif", fontSize:".88rem", fontWeight:700, color:"#0C1A2E", marginBottom:"1rem" },
  grid4:  { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:".75rem" },
  statBox:{ background:"#F0F9FF", borderRadius:"12px", padding:".85rem", textAlign:"center" as const },
  statVal:{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800 },
  statLbl:{ fontSize:".62rem", color:"#5B7EA6", textTransform:"uppercase" as const, letterSpacing:".06em", marginTop:".2rem" },
  fileBtn:{ display:"inline-flex", alignItems:"center", gap:".4rem", padding:".5rem .9rem", borderRadius:"8px", background:"#E0F2FE", color:"#0369A1", fontSize:".78rem", fontWeight:700, textDecoration:"none", marginRight:".5rem", marginBottom:".5rem" },
  jobRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:".6rem 0", borderBottom:"1px solid #F0F9FF" },
  jobTopic:{ fontSize:".78rem", fontWeight:600, color:"#0C1A2E", maxWidth:"260px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const },
  jobMeta:{ fontSize:".68rem", color:"#5B7EA6" },
  bankBox:{ background:"#F0F9FF", borderRadius:"10px", padding:".75rem 1rem", fontSize:".8rem" },
};

const DEG: Record<string,string> = { OND_HND_NCE:"HND/OND", BSC_BED_BA:"BSc/BEd", PGD_MSC_PHD:"PGD/MSc", PHD:"PhD" };
const STATUS_COLORS: Record<string,{bg:string,color:string}> = {
  NOT_STARTED:{bg:"#F1F5F9",color:"#64748B"}, IN_PROGRESS:{bg:"#FEF9C3",color:"#854D0E"},
  PRELIM_SUBMITTED:{bg:"#FEF9C3",color:"#854D0E"}, SUBMITTED:{bg:"#DBEAFE",color:"#1E40AF"},
  QC_IN_PROGRESS:{bg:"#EDE9FE",color:"#5B21B6"}, QC_DONE:{bg:"#D1FAE5",color:"#065F46"},
  DELIVERED:{bg:"#D1FAE5",color:"#065F46"},
};

function StaffDetailDrawer({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/staff/${staffId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));
  }, [staffId]);

  if (loading) return (
    <>
      <div style={C.overlay} onClick={onClose} />
      <div style={C.drawer}><div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div></div>
    </>
  );
  if (!data) return null;

  const { staff, jobHistory, statusCounts, earningsSummary, withdrawals } = data;

  return (
    <>
      <div style={C.overlay} onClick={onClose} />
      <div style={C.drawer}>
        <div style={C.dHead}>
          <div>
            <div style={C.dName}>{staff.name}</div>
            <div style={C.dMeta}>{staff.role} · {staff.email} · {staff.phone}</div>
            <div style={C.dMeta}>Joined {new Date(staff.createdAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"})}</div>
          </div>
          <button style={C.dClose} onClick={onClose}>×</button>
        </div>

        <div style={C.dBody}>
          {/* Application Documents */}
          <div style={C.section}>
            <div style={C.sTitle}>📄 Application Documents</div>
            {staff.cvFileUrl && (
              <a style={C.fileBtn} href={`/api/download/guideline?url=${encodeURIComponent(staff.cvFileUrl)}&label=${encodeURIComponent(staff.name+" CV")}`} target="_blank" rel="noreferrer">📎 CV / Resume</a>
            )}
            {staff.sampleFileUrl && (
              <a style={C.fileBtn} href={`/api/download/guideline?url=${encodeURIComponent(staff.sampleFileUrl)}&label=${encodeURIComponent(staff.name+" Work Sample")}`} target="_blank" rel="noreferrer">📎 Work Sample</a>
            )}
            {!staff.cvFileUrl && !staff.sampleFileUrl && <p style={{fontSize:".78rem",color:"#5B7EA6"}}>No documents on file.</p>}
          </div>

          {/* Earnings Summary */}
          <div style={C.section}>
            <div style={C.sTitle}>💰 Earnings Summary</div>
            <div style={C.grid4}>
              <div style={C.statBox}><div style={{...C.statVal,color:"#0284C7"}}>₦{(earningsSummary.availableKobo/100).toLocaleString()}</div><div style={C.statLbl}>Available</div></div>
              <div style={C.statBox}><div style={{...C.statVal,color:"#CA8A04"}}>₦{(earningsSummary.pendingKobo/100).toLocaleString()}</div><div style={C.statLbl}>Pending</div></div>
              <div style={C.statBox}><div style={{...C.statVal,color:"#16A34A"}}>₦{(earningsSummary.withdrawnKobo/100).toLocaleString()}</div><div style={C.statLbl}>Withdrawn</div></div>
              <div style={C.statBox}><div style={{...C.statVal,color:"#0C1A2E"}}>₦{(earningsSummary.totalKobo/100).toLocaleString()}</div><div style={C.statLbl}>Total Earned</div></div>
            </div>
          </div>

          {/* Bank Details */}
          {staff.accountNumber && (
            <div style={C.section}>
              <div style={C.sTitle}>🏦 Bank Details</div>
              <div style={C.bankBox}>
                <div style={{fontWeight:700,color:"#0C1A2E"}}>{staff.accountName}</div>
                <div style={{color:"#5B7EA6",marginTop:"2px"}}>{staff.bankName} · {staff.accountNumber}</div>
              </div>
            </div>
          )}

          {/* Job Status Overview */}
          <div style={C.section}>
            <div style={C.sTitle}>📊 Job Status Overview</div>
            <div style={{display:"flex",gap:".5rem",flexWrap:"wrap" as const}}>
              {Object.entries(statusCounts).map(([status,count]:any) => (
                <span key={status} style={{...C.badge,...(STATUS_COLORS[status]||{bg:"#F1F5F9",color:"#64748B"})}}>
                  {status.replace(/_/g," ")}: {count}
                </span>
              ))}
              {Object.keys(statusCounts).length === 0 && <p style={{fontSize:".78rem",color:"#5B7EA6"}}>No jobs assigned yet.</p>}
            </div>
          </div>

          {/* Job History */}
          <div style={C.section}>
            <div style={C.sTitle}>📋 Job History ({jobHistory.length})</div>
            {jobHistory.length === 0 ? <p style={{fontSize:".78rem",color:"#5B7EA6"}}>No jobs yet.</p> : (
              <div style={{maxHeight:"320px",overflowY:"auto" as const}}>
                {jobHistory.map((j:any) => (
                  <div key={j.id} style={C.jobRow}>
                    <div>
                      <div style={C.jobTopic}>{j.chapterLabel} — {j.topic}</div>
                      <div style={C.jobMeta}>{DEG[j.degreeGroup]||j.degreeGroup} · {j.orderCreatedAt ? new Date(j.orderCreatedAt).toLocaleDateString("en-NG",{day:"numeric",month:"short"}) : ""}</div>
                    </div>
                    <span style={{...C.badge,...(STATUS_COLORS[j.status]||{bg:"#F1F5F9",color:"#64748B"})}}>{j.status.replace(/_/g," ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawal History */}
          <div style={C.section}>
            <div style={C.sTitle}>🏦 Withdrawal History ({withdrawals.length})</div>
            {withdrawals.length === 0 ? <p style={{fontSize:".78rem",color:"#5B7EA6"}}>No withdrawals yet.</p> : (
              withdrawals.map((w:any) => (
                <div key={w.id} style={C.jobRow}>
                  <div>
                    <div style={{fontSize:".82rem",fontWeight:700,color:"#0C1A2E"}}>₦{(w.amountKobo/100).toLocaleString()}</div>
                    <div style={C.jobMeta}>{w.bankName} · {w.accountNumber} · {new Date(w.requestedAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"})}</div>
                  </div>
                  <span style={{...C.badge,
                    background: w.status==="PAID"?"#D1FAE5":w.status==="APPROVED"?"#DBEAFE":w.status==="REJECTED"?"#FEE2E2":"#FEF9C3",
                    color:      w.status==="PAID"?"#065F46":w.status==="APPROVED"?"#1E40AF":w.status==="REJECTED"?"#991B1B":"#854D0E",
                  }}>{w.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function StaffList() {
  const [staff,   setStaff]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role,    setRole]    = useState("all");
  const [status,  setStatus]  = useState("all");
  const [search,  setSearch]  = useState("");
  const [acting,  setActing]  = useState<string|null>(null);
  const [modal,   setModal]   = useState<any>(null);
  const [reason,  setReason]  = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string|null>(null);

  async function load() {
    setLoading(true);
    const res  = await fetch(`/api/admin/staff?role=${role}&search=${encodeURIComponent(search)}&filter=approved`);
    const data = await res.json();
    if (data.success) setStaff(data.data);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[role,search]);

  async function act(staffId:string, action:string) {
    setActing(staffId);
    const res  = await fetch("/api/admin/staff",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({staffId,action,reason})});
    const data = await res.json();
    if(res.ok){ setModal(null); setReason(""); load(); }
    else toast.error(data.error || "Something went wrong");
    setActing(null);
  }

  const filtered = staff.filter(s => {
    if (status === "active")    return !s.isSuspended;
    if (status === "suspended") return s.isSuspended;
    return true;
  });

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>All Staff</h1>
        <p style={C.sub}>Click any staff member to view full profile — documents, job history, earnings and withdrawals.</p>
        <div style={C.sbar}>
          <div style={{position:"relative",flex:1,minWidth:"180px"}}>
            <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
            <input style={C.sinput} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, email or phone..." />
          </div>
          <select style={C.sel} value={role} onChange={e=>setRole(e.target.value)}>
            {["all","WRITER","ANALYST","QC"].map(r=><option key={r} value={r}>{r==="all"?"All Roles":r}</option>)}
          </select>
          <select style={C.sel} value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <div style={C.card}>
            {filtered.length === 0 ? (
              <div style={C.empty}>No staff found.</div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <table style={C.table}>
                  <thead>
                    <tr>{["Name","Phone","Email","Role","Active Jobs","Total Earned","Status","Actions"].map(h=><th key={h} style={C.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.map((s:any)=>(
                      <tr key={s.id} style={{...C.row,opacity:s.isSuspended?.7:1}}
                        onMouseEnter={e=>(e.currentTarget.style.background="#F8FBFF")}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                        <td style={{...C.td,fontWeight:700,whiteSpace:"nowrap" as const}} onClick={()=>setSelectedStaff(s.id)}>{s.name}</td>
                        <td style={{...C.td,color:"#5B7EA6"}} onClick={()=>setSelectedStaff(s.id)}>{s.phone}</td>
                        <td style={{...C.td,color:"#5B7EA6",maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}} onClick={()=>setSelectedStaff(s.id)}>{s.email}</td>
                        <td style={C.td} onClick={()=>setSelectedStaff(s.id)}><span style={{...C.badge,background:"#E0F2FE",color:"#0369A1"}}>{s.role}</span></td>
                        <td style={{...C.td,textAlign:"center" as const}} onClick={()=>setSelectedStaff(s.id)}>{s.activeJobs||0}</td>
                        <td style={{...C.td,fontWeight:700,color:"#0284C7",whiteSpace:"nowrap" as const}} onClick={()=>setSelectedStaff(s.id)}>₦{(s.totalEarnedNaira||0).toLocaleString()}</td>
                        <td style={C.td} onClick={()=>setSelectedStaff(s.id)}>
                          <span style={{...C.badge,...(s.isSuspended
                            ?{background:"#FEE2E2",color:"#991B1B"}
                            :{background:"#D1FAE5",color:"#065F46"})}}>
                            {s.isSuspended?"Suspended":"Active"}
                          </span>
                        </td>
                        <td style={C.td}>
                          {s.isSuspended
                            ? <button style={C.btnG} disabled={acting===s.id} onClick={(e)=>{e.stopPropagation();act(s.id,"unsuspend");}}>
                                {acting===s.id?"...":"✓ Reactivate"}
                              </button>
                            : <button style={C.btnY} onClick={(e)=>{e.stopPropagation();setModal({id:s.id,name:s.name});}}>
                                Suspend
                              </button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {modal && (
          <div style={C.modal} onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
            <div style={C.mCard}>
              <div style={C.mTitle}>Suspend {modal.name}?</div>
              <div style={C.mSub}>They won't receive new jobs but their account stays intact. You can reactivate them at any time.</div>
              <textarea style={C.ta} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason for suspension (optional)" rows={2} />
              <div style={C.mbtns}>
                <button style={C.btnR} disabled={acting===modal.id} onClick={()=>act(modal.id,"suspend")}>
                  {acting===modal.id?"Suspending...":"Confirm Suspend"}
                </button>
                <button style={C.btnN} onClick={()=>{ setModal(null); setReason(""); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {selectedStaff && (
          <StaffDetailDrawer staffId={selectedStaff} onClose={()=>setSelectedStaff(null)} />
        )}
      </div>
    </AdminLayout>
  );
}
