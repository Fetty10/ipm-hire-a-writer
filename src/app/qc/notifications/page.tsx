"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";

const QC_NAV = [
  { label:"Dashboard",           icon:"📊", href:"/qc/dashboard"              },
  { label:"Pending Checks",      icon:"🔍", href:"/qc/checks/pending"          },
  { label:"Active Checks",       icon:"⚙️", href:"/qc/checks/active"           },
  { label:"Cleared & Sent",      icon:"✅", href:"/qc/checks/cleared"          },
  { label:"Pending Corrections", icon:"🔧", href:"/qc/corrections/pending"     },
  { label:"Working on Corrections",icon:"✏️",href:"/qc/corrections/active"     },
  { label:"Corrections Sent",    icon:"📨", href:"/qc/corrections/done"        },
  { label:"Earnings",            icon:"💰", href:"/qc/earnings"                },
  { label:"Withdraw",            icon:"🏦", href:"/qc/withdraw"                },
  { label:"Notifications",       icon:"🔔", href:"/qc/notifications"           },
  { label:"Profile",             icon:"👤", href:"/qc/profile"                 },
];

const TYPE_STYLE:Record<string,{dot:string,border:string}> = {
  ACTION_REQUIRED: {dot:"#38BDF8",   border:"#38BDF8"},
  INFO:            {dot:"#7DD3FC",   border:"#BAE6FD"},
  SUCCESS:         {dot:"#4ADE80",   border:"#4ADE80"},
  ALERT:           {dot:"#F87171",   border:"#F87171"},
};

function timeAgo(d:string) {
  const diff = Date.now()-new Date(d).getTime();
  const m=Math.floor(diff/60000),h=Math.floor(diff/3600000),dy=Math.floor(diff/86400000);
  if(m<60) return `${m}m ago`; if(h<24) return `${h}h ago`; return `${dy}d ago`;
}

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".1rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  top:   { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.25rem" },
  markBtn:{ padding:".5rem 1rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", background:"#fff", fontSize:".78rem", fontWeight:600, color:"#0369A1", cursor:"pointer" },
  ncard: { background:"#fff", borderRadius:"14px", borderLeft:"4px solid #BAE6FD", border:"1.5px solid #E0F2FE", padding:"1rem 1.25rem", marginBottom:".6rem", cursor:"pointer", transition:"all .2s" },
  nhead: { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:".75rem" },
  nleft: { display:"flex", alignItems:"flex-start", gap:".6rem", flex:1 },
  ndot:  { width:"8px", height:"8px", borderRadius:"50%", marginTop:"6px", flexShrink:0 },
  ntitle:{ fontSize:".85rem", fontWeight:700, color:"#0C1A2E" },
  nmsg:  { fontSize:".78rem", color:"#5B7EA6", marginTop:".3rem", lineHeight:1.5 },
  ntime: { fontSize:".72rem", color:"#5B7EA6", flexShrink:0 },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
};

export default function WriterNotifications() {
  const { data: session } = useSession();
  const [notifs,  setNotifs]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"WR";

  useEffect(()=>{
    fetch("/api/notifications").then(r=>r.json()).then(d=>{ if(d.success) setNotifs(d.data.notifications); setLoading(false); });
  },[]);

  async function markAll() {
    setMarking(true);
    await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({markAllRead:true})});
    setNotifs(prev=>prev.map(n=>({...n,isRead:true})));
    setMarking(false);
  }

  async function markOne(id:string) {
    await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({notificationId:id})});
    setNotifs(prev=>prev.map(n=>n.id===id?{...n,isRead:true}:n));
  }

  const unread = notifs.filter(n=>!n.isRead).length;

  return (
    <StaffLayout navItems={NAV} role="Quality Control" initials={initials}>
      <div style={C.page}>
        <div style={C.top}>
          <div>
            <h1 style={C.h1}>Notifications</h1>
            <p style={C.sub}>{unread>0?`${unread} unread`:"All caught up"}</p>
          </div>
          {unread>0&&<button style={C.markBtn} disabled={marking} onClick={markAll}>{marking?"...":"Mark all read"}</button>}
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : notifs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>🔔</div>
            <div style={C.etitle}>No notifications yet.</div>
          </div>
        ) : notifs.map((n:any)=>{
          const s = TYPE_STYLE[n.type]||TYPE_STYLE.INFO;
          return (
            <div key={n.id} style={{...C.ncard,borderLeftColor:s.border,opacity:n.isRead?.8:1}} onClick={()=>!n.isRead&&markOne(n.id)}>
              <div style={C.nhead}>
                <div style={C.nleft}>
                  <div style={{...C.ndot,background:n.isRead?"#CBD5E1":s.dot}}/>
                  <div>
                    <div style={{...C.ntitle,fontWeight:n.isRead?600:700}}>{n.title}</div>
                    <div style={C.nmsg}>{n.message}</div>
                  </div>
                </div>
                <span style={C.ntime}>{timeAgo(n.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </StaffLayout>
  );
}
