"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const ACTION_LABELS: Record<string,string> = {
  CONFIRM_BANK_TRANSFER: "✅ Confirmed Bank Transfer",
  LODGE_CORRECTION:      "🔧 Lodged Correction",
  APPROVE_STAFF:         "👤 Approved Staff",
  DECLINE_STAFF:         "❌ Declined Staff",
  SUSPEND_STAFF:         "🚫 Suspended Staff",
  UNSUSPEND_STAFF:       "♻️ Reinstated Staff",
  EDIT_ORDER:            "✏️ Edited Order",
  REASSIGN_CHAPTER:      "🔄 Reassigned Chapter",
};

const C = {
  page:  { maxWidth:"1000px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  tabs:  { display:"flex", gap:".5rem", marginBottom:"1.5rem", flexWrap:"wrap" as const },
  tab:   { padding:".5rem 1.1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".8rem", fontWeight:700, cursor:"pointer", background:"#fff", color:"#5B7EA6" },
  tabA:  { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", overflow:"hidden", marginBottom:"1rem" },
  row:   { display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:".75rem", alignItems:"center", padding:".85rem 1.25rem", borderBottom:"1px solid #F0F9FF", fontSize:".82rem" },
  hrow:  { display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:".75rem", padding:".6rem 1.25rem", background:"#F0F9FF", fontSize:".72rem", fontWeight:700, color:"#5B7EA6", textTransform:"uppercase" as const, letterSpacing:".06em" },
  stat:  { background:"#fff", borderRadius:"14px", border:"1.5px solid #E0F2FE", padding:"1rem 1.25rem", textAlign:"center" as const },
  sval:  { fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:"#0C1A2E" },
  slbl:  { fontSize:".72rem", color:"#5B7EA6", marginTop:"3px", fontWeight:600 },
  grid:  { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:".75rem", marginBottom:"1.5rem" },
  sel:   { padding:".55rem .85rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".82rem", background:"#fff", outline:"none" },
  frow:  { display:"flex", gap:".75rem", marginBottom:"1.25rem", flexWrap:"wrap" as const },
  empty: { textAlign:"center" as const, padding:"3rem", color:"#5B7EA6", fontSize:".85rem" },
  badge: { padding:"2px 10px", borderRadius:"999px", fontSize:".7rem", fontWeight:700, background:"#EDE9FE", color:"#5B21B6", whiteSpace:"nowrap" as const },
  green: { background:"#D1FAE5", color:"#065F46" },
  red:   { background:"#FEE2E2", color:"#991B1B" },
};

export default function AdminActivityPage() {
  const [view,       setView]       = useState<"summary"|"sessions"|"activity">("summary");
  const [adminId,    setAdminId]    = useState("");
  const [month,      setMonth]      = useState(new Date().toISOString().slice(0,7));
  const [data,       setData]       = useState<any>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ view, month });
    if (adminId) params.set("adminId", adminId);
    fetch(`/api/admin/activity?${params}`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setData(d.data); setLoading(false); });
  }, [view, adminId, month]);

  const admins   = data?.admins || [];
  const summary  = data?.summary || [];
  const sessions = data?.sessions || [];
  const activities = data?.activities || [];

  return (
    <AdminLayout>
      <div style={C.page}>
        <h1 style={C.h1}>Admin Activity Monitor</h1>
        <p style={C.sub}>Track logins, logouts and actions taken by each admin.</p>

        {/* Filters */}
        <div style={C.frow}>
          <select style={C.sel} value={adminId} onChange={e=>setAdminId(e.target.value)}>
            <option value="">All Admins</option>
            {admins.map((a:any) => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
          </select>
          <input type="month" style={C.sel} value={month} onChange={e=>setMonth(e.target.value)} />
        </div>

        {/* Tabs */}
        <div style={C.tabs}>
          {(["summary","sessions","activity"] as const).map(v => (
            <button key={v} style={{...C.tab,...(view===v?C.tabA:{})}} onClick={()=>setView(v)}>
              {v === "summary" ? "📊 Summary" : v === "sessions" ? "🔑 Login Sessions" : "📋 Activity Log"}
            </button>
          ))}
        </div>

        {loading ? <div style={C.empty}>Loading...</div> : (
          <>
            {/* Summary View */}
            {view === "summary" && (
              <div>
                {summary.map((a:any) => (
                  <div key={a.id} style={{...C.card, marginBottom:"1.25rem"}}>
                    <div style={{padding:"1rem 1.25rem", borderBottom:"1px solid #F0F9FF"}}>
                      <div style={{fontFamily:"'Syne',sans-serif", fontWeight:800, color:"#0C1A2E", fontSize:"1rem"}}>{a.name}</div>
                      <div style={{fontSize:".75rem", color:"#5B7EA6"}}>{a.role} · Last login: {a.last_login ? new Date(a.last_login).toLocaleString("en-NG") : "Never"}</div>
                    </div>
                    <div style={{...C.grid, padding:"1rem 1.25rem", marginBottom:0}}>
                      <div style={C.stat}><div style={C.sval}>{a.login_count||0}</div><div style={C.slbl}>Logins</div></div>
                      <div style={C.stat}><div style={{...C.sval,color:"#16A34A"}}>{a.bank_transfers_confirmed||0}</div><div style={C.slbl}>Bank Transfers</div></div>
                      <div style={C.stat}><div style={{...C.sval,color:"#0284C7"}}>₦{((a.total_amount_confirmed||0)/100).toLocaleString()}</div><div style={C.slbl}>Amount Processed</div></div>
                      <div style={C.stat}><div style={{...C.sval,color:"#D97706"}}>{a.corrections_lodged||0}</div><div style={C.slbl}>Corrections Lodged</div></div>
                      <div style={C.stat}><div style={{...C.sval,color:"#5B21B6"}}>{a.staff_approved||0}</div><div style={C.slbl}>Staff Approved</div></div>
                      <div style={C.stat}><div style={{...C.sval,color:"#DC2626"}}>{a.staff_suspended||0}</div><div style={C.slbl}>Staff Suspended</div></div>
                      <div style={C.stat}><div style={C.sval}>{a.total_actions||0}</div><div style={C.slbl}>Total Actions</div></div>
                    </div>
                  </div>
                ))}
                {summary.length === 0 && <div style={C.empty}>No data for this period.</div>}
              </div>
            )}

            {/* Sessions View */}
            {view === "sessions" && (
              <div style={C.card}>
                <div style={C.hrow}>
                  <span>Admin</span><span>Event</span><span>IP Address</span><span>Time</span>
                </div>
                {sessions.length === 0 ? <div style={C.empty}>No sessions found.</div> : sessions.map((s:any) => (
                  <div key={s.id} style={C.row}>
                    <div>
                      <div style={{fontWeight:600,color:"#0C1A2E"}}>{s.name}</div>
                      <div style={{fontSize:".72rem",color:"#5B7EA6"}}>{s.role}</div>
                    </div>
                    <span style={{...C.badge,...(s.event==="LOGIN"?C.green:C.red)}}>
                      {s.event === "LOGIN" ? "🔓 Login" : "🔒 Logout"}
                    </span>
                    <div style={{fontSize:".78rem",color:"#5B7EA6",fontFamily:"monospace"}}>{s.ipAddress}</div>
                    <div style={{fontSize:".75rem",color:"#5B7EA6",whiteSpace:"nowrap" as const}}>
                      {new Date(s.createdAt).toLocaleString("en-NG",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Activity Log View */}
            {view === "activity" && (
              <div style={C.card}>
                <div style={{...C.hrow, gridTemplateColumns:"1fr 1fr 2fr auto"}}>
                  <span>Admin</span><span>Action</span><span>Detail</span><span>Time</span>
                </div>
                {activities.length === 0 ? <div style={C.empty}>No activity found.</div> : activities.map((a:any) => (
                  <div key={a.id} style={{...C.row, gridTemplateColumns:"1fr 1fr 2fr auto"}}>
                    <div>
                      <div style={{fontWeight:600,color:"#0C1A2E",fontSize:".82rem"}}>{a.name}</div>
                      <div style={{fontSize:".7rem",color:"#5B7EA6"}}>{a.role}</div>
                    </div>
                    <span style={{...C.badge}}>
                      {ACTION_LABELS[a.action] || a.action}
                    </span>
                    <div style={{fontSize:".78rem",color:"#475569",lineHeight:1.4}}>
                      {a.detail}
                      {a.amountKobo > 0 && <span style={{color:"#16A34A",fontWeight:700}}> · ₦{(a.amountKobo/100).toLocaleString()}</span>}
                    </div>
                    <div style={{fontSize:".72rem",color:"#5B7EA6",whiteSpace:"nowrap" as const}}>
                      {new Date(a.createdAt).toLocaleString("en-NG",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
