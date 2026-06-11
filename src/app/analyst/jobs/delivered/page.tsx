"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";

const NAV = [
  { label:"Dashboard",    icon:"📊", href:"/analyst/dashboard" },
  { label:"Pending Jobs", icon:"📋", href:"/analyst/jobs/pending" },
  { label:"Active Jobs",  icon:"✍️", href:"/analyst/jobs/active" },
  { label:"Delivered",    icon:"✅", href:"/analyst/jobs/delivered" },
  { label:"Earnings",     icon:"💰", href:"/analyst/earnings" },
  { label:"Withdraw",     icon:"🏦", href:"/analyst/withdraw" },
  { label:"Notifications",icon:"🔔", href:"/analyst/notifications" },
  { label:"Profile",      icon:"👤", href:"/analyst/profile" },
];

const DEG:Record<string,string> = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};

function getStatusLabel(status: string) {
  switch (status) {
    case "SUBMITTED":       return { label:"Sent to QC",   bg:"#E0F2FE", color:"#0369A1" };
    case "QC_IN_PROGRESS":  return { label:"QC In Progress",bg:"#EDE9FE", color:"#5B21B6" };
    case "QC_DONE":         return { label:"QC Cleared",   bg:"#D1FAE5", color:"#065F46" };
    case "DELIVERED":       return { label:"Delivered ✓",  bg:"#D1FAE5", color:"#065F46" };
    default:                return { label:status,          bg:"#F1F5F9", color:"#64748B" };
  }
}

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  card:  { background:"#fff", borderRadius:"14px", border:"1.5px solid #E0F2FE", padding:".9rem 1.25rem", marginBottom:".6rem", display:"flex", alignItems:"center", gap:"1rem" },
  num:   { width:"36px", height:"36px", borderRadius:"10px", background:"#E0F2FE", color:"#0369A1", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:".78rem", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  info:  { flex:1, minWidth:0 },
  title: { fontSize:".85rem", fontWeight:700, color:"#0C1A2E" },
  meta:  { fontSize:".72rem", color:"#5B7EA6", marginTop:"2px" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, flexShrink:0 as const },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
};

export default function AnalystDelivered() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"WR";

  useEffect(()=>{
    fetch(`/api/staff/jobs?status=delivered&search=${encodeURIComponent(search)}`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setJobs(d.data); })
      .finally(()=>setLoading(false));
  },[search]);

  return (
    <StaffLayout navItems={NAV} role="Analyst" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Submitted Jobs</h1>
        <p style={C.sub}>All chapters you've submitted — including those awaiting QC or already delivered.</p>

        <div style={{position:"relative",marginBottom:"1.25rem"}}>
          <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
          <input style={{width:"100%",padding:".65rem 1rem .65rem 2.2rem",borderRadius:"10px",border:"1.5px solid #BAE6FD",fontSize:".85rem",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box" as const}}
            placeholder="Search by topic..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>📦</div>
            <div style={C.etitle}>No submitted jobs yet.</div>
          </div>
        ) : jobs.map((job:any)=>{
          const s = getStatusLabel(job.status);
          return (
            <div key={job.id} style={C.card}>
              <div style={{...C.num,background:job.status==="DELIVERED"?"#38BDF8":job.status==="QC_IN_PROGRESS"?"#EDE9FE":"#E0F2FE",color:job.status==="DELIVERED"?"#0C1A2E":job.status==="QC_IN_PROGRESS"?"#5B21B6":"#0369A1"}}>
                {job.chapterNumber}
              </div>
              <div style={C.info}>
                <div style={C.title}>{job.chapterLabel}</div>
                <div style={C.meta}>{job.topic}</div>
                <div style={C.meta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup}{job.submittedAt?` · Submitted ${new Date(job.submittedAt).toLocaleDateString("en-NG")}`:""}</div>
              </div>
              <span style={{...C.badge,background:s.bg,color:s.color}}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </StaffLayout>
  );
}
