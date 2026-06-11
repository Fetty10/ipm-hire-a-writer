"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";

const WRITER_NAV = [
  { label:"Dashboard",    icon:"📊", href:"/writer/dashboard" },
  { label:"Pending Jobs", icon:"📋", href:"/writer/jobs/pending" },
  { label:"Active Jobs",  icon:"✍️", href:"/writer/jobs/active" },
  { label:"Delivered",    icon:"✅", href:"/writer/jobs/delivered" },
  { label:"Earnings",     icon:"💰", href:"/writer/earnings" },
  { label:"Withdraw",     icon:"🏦", href:"/writer/withdraw" },
  { label:"Notifications",icon:"🔔", href:"/writer/notifications" },
  { label:"Profile",      icon:"👤", href:"/writer/profile" },
];

const C = {
  page:   { maxWidth:"800px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:    { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  grid4:  { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:".75rem", marginBottom:"1.25rem" },
  scard:  { background:"#fff", borderRadius:"14px", border:"1.5px solid #E0F2FE", padding:"1rem", cursor:"pointer", transition:"all .2s" },
  sicon:  { fontSize:"1.3rem", marginBottom:".5rem" },
  sval:   { fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:"#0C1A2E", lineHeight:1 },
  slabel: { fontSize:".72rem", color:"#5B7EA6", marginTop:".2rem" },
  grid2:  { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" },
  earBox: { background:"#0C1A2E", borderRadius:"16px", padding:"1.25rem", color:"#fff", cursor:"pointer", position:"relative" as const, overflow:"hidden" },
  earLbl: { fontSize:".68rem", color:"#7DD3FC", textTransform:"uppercase" as const, letterSpacing:".08em", fontWeight:700, marginBottom:".3rem" },
  earVal: { fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, color:"#fff", marginBottom:"1rem" },
  earGrid:{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:".5rem" },
  earItem:{ fontSize:".7rem", color:"#7DD3FC" },
  earNum: { fontWeight:700, color:"#fff", fontSize:".82rem" },
  card:   { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", padding:"1.25rem" },
  chead:  { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1rem" },
  ctitle: { fontFamily:"'Syne',sans-serif", fontSize:".85rem", fontWeight:700, color:"#0C1A2E" },
  clink:  { fontSize:".75rem", color:"#0369A1", fontWeight:600, background:"none", border:"none", cursor:"pointer", textDecoration:"underline" },
  jrow:   { display:"flex", alignItems:"center", gap:".75rem", padding:".6rem .75rem", borderRadius:"10px", border:"1px solid #E0F2FE", marginBottom:".4rem", cursor:"pointer" },
  jnum:   { width:"32px", height:"32px", borderRadius:"8px", background:"#E0F2FE", color:"#0369A1", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".78rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  jlabel: { flex:1, fontSize:".8rem", fontWeight:600, color:"#0C1A2E", minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const },
  jtopic: { fontSize:".72rem", color:"#5B7EA6", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const },
  badge:  { display:"inline-flex", padding:"2px 8px", borderRadius:"999px", fontSize:".65rem", fontWeight:700, flexShrink:0 },
  bYellow:{background:"#FEF9C3",color:"#854D0E"},
  bSky:   {background:"#E0F2FE",color:"#0369A1"},
  empty:  { textAlign:"center" as const, padding:"1.5rem", fontSize:".8rem", color:"#5B7EA6" },
};

export default function WriterDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs,     setJobs]     = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(()=>{
    async function load() {
      const [jRes,eRes] = await Promise.all([
        fetch("/api/staff/jobs?status=all"),
        fetch("/api/staff/earnings"),
      ]);
      const jData = await jRes.json();
      const eData = await eRes.json();
      if (jData.success) setJobs(jData.data);
      if (eData.success) setEarnings(eData.data.summary);
      setLoading(false);
    }
    load();
  },[]);

  const pending   = jobs.filter(j=>j.status==="NOT_STARTED");
  const active    = jobs.filter(j=>["IN_PROGRESS","PRELIM_SUBMITTED"].includes(j.status));
  const delivered = jobs.filter(j=>j.status==="DELIVERED");
  const name      = session?.user?.name?.split(" ")[0]||"Writer";
  const initials  = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"WR";

  const nav = WRITER_NAV.map(item=>{
    if(item.href==="/writer/jobs/pending") return {...item,badge:pending.length};
    if(item.href==="/writer/jobs/active")  return {...item,badge:active.length};
    return item;
  });

  return (
    <StaffLayout navItems={nav} role="Writer" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Writer Dashboard</h1>
        <p style={C.sub}>Welcome back, {name}. Here's your summary.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div> : (
          <>
            <div style={C.grid4}>
              {[
                {icon:"📋",val:jobs.length,      label:"All Jobs",     href:"/writer/jobs/pending"},
                {icon:"⏳",val:pending.length,   label:"Pending",      href:"/writer/jobs/pending"},
                {icon:"✍️",val:active.length,    label:"Active",       href:"/writer/jobs/active"},
                {icon:"✅",val:delivered.length, label:"Delivered",    href:"/writer/jobs/delivered"},
              ].map(s=>(
                <div key={s.label} style={C.scard} onClick={()=>router.push(s.href)}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="#38BDF8";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="#E0F2FE";}}>
                  <div style={C.sicon}>{s.icon}</div>
                  <div style={C.sval}>{s.val}</div>
                  <div style={C.slabel}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={C.grid2}>
              {/* Earnings */}
              <div style={C.earBox} onClick={()=>router.push("/writer/earnings")}>
                <div style={{position:"absolute",top:"-20px",right:"-20px",width:"80px",height:"80px",background:"rgba(56,189,248,.1)",borderRadius:"50%"}}/>
                <div style={C.earLbl}>Available Balance</div>
                <div style={C.earVal}>₦{(earnings?.available||0).toLocaleString()}</div>
                <div style={C.earGrid}>
                  {[
                    {label:"Pending",    val:earnings?.pending||0},
                    {label:"Total",      val:earnings?.totalEarned||0},
                    {label:"Withdrawn",  val:earnings?.withdrawn||0},
                  ].map(e=>(
                    <div key={e.label}>
                      <div style={C.earItem}>{e.label}</div>
                      <div style={C.earNum}>₦{e.val.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent active jobs */}
              <div style={C.card}>
                <div style={C.chead}>
                  <span style={C.ctitle}>Recent Active Jobs</span>
                  <button style={C.clink} onClick={()=>router.push("/writer/jobs/active")}>View all →</button>
                </div>
                {active.length===0
                  ? <div style={C.empty}>No active jobs right now.</div>
                  : active.slice(0,3).map((job:any)=>(
                    <div key={job.id} style={C.jrow} onClick={()=>router.push("/writer/jobs/active")}>
                      <div style={C.jnum}>{job.chapterNumber}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={C.jlabel}>{job.chapterLabel}</div>
                        <div style={C.jtopic}>{job.topic}</div>
                      </div>
                      <span style={{...C.badge,...C.bYellow}}>Active</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
}
