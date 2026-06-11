"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";

const TYPE_STYLE:Record<string,{dot:string,border:string}> = {
  ACTION_REQUIRED:{dot:"#38BDF8",border:"#38BDF8"},
  INFO:           {dot:"#7DD3FC",border:"#BAE6FD"},
  SUCCESS:        {dot:"#4ADE80",border:"#4ADE80"},
  ALERT:          {dot:"#F87171",border:"#F87171"},
};

function timeAgo(d:string) {
  const diff=Date.now()-new Date(d).getTime();
  const m=Math.floor(diff/60000),h=Math.floor(diff/3600000),dy=Math.floor(diff/86400000);
  if(m<60)return`${m}m ago`;if(h<24)return`${h}h ago`;return`${dy}d ago`;
}

export default function StudentNotifications() {
  const [notifs,  setNotifs]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

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
    <StudentLayout>
      <div style={{maxWidth:"640px",margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
          <div>
            <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"1.6rem",fontWeight:800,color:"#0C1A2E",letterSpacing:"-.02em",marginBottom:".1rem"}}>Notifications</h1>
            <p style={{fontSize:".85rem",color:"#5B7EA6"}}>{unread>0?`${unread} unread`:"All caught up"}</p>
          </div>
          {unread>0&&<button style={{padding:".5rem 1rem",borderRadius:"10px",border:"1.5px solid #BAE6FD",background:"#fff",fontSize:".78rem",fontWeight:600,color:"#0369A1",cursor:"pointer"}} disabled={marking} onClick={markAll}>{marking?"...":"Mark all read"}</button>}
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : notifs.length===0 ? (
          <div style={{textAlign:"center",padding:"4rem 1rem"}}>
            <div style={{fontSize:"2.5rem",marginBottom:".75rem"}}>🔔</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:700,color:"#0C1A2E"}}>No notifications yet.</div>
          </div>
        ) : notifs.map((n:any)=>{
          const s = TYPE_STYLE[n.type]||TYPE_STYLE.INFO;
          return (
            <div key={n.id}
              style={{background:"#fff",borderRadius:"14px",borderLeft:`4px solid ${s.border}`,border:`1.5px solid #E0F2FE`,borderLeftColor:s.border,padding:"1rem 1.25rem",marginBottom:".6rem",cursor:"pointer",opacity:n.isRead?.8:1}}
              onClick={()=>!n.isRead&&markOne(n.id)}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:".75rem"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:".6rem",flex:1}}>
                  <div style={{width:"8px",height:"8px",borderRadius:"50%",background:n.isRead?"#CBD5E1":s.dot,marginTop:"6px",flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:".85rem",fontWeight:n.isRead?600:700,color:"#0C1A2E"}}>{n.title}</div>
                    <div style={{fontSize:".78rem",color:"#5B7EA6",marginTop:".3rem",lineHeight:1.5}}>{n.message}</div>
                  </div>
                </div>
                <span style={{fontSize:".72rem",color:"#5B7EA6",flexShrink:0}}>{timeAgo(n.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </StudentLayout>
  );
}
