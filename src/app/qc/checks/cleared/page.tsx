"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";

const QC_NAV = [
  { label:"Dashboard",             icon:"📊", href:"/qc/dashboard"           },
  { label:"Pending Checks",        icon:"🔍", href:"/qc/checks/pending"       },
  { label:"Active Checks",         icon:"⚙️", href:"/qc/checks/active"        },
  { label:"Cleared & Sent",        icon:"✅", href:"/qc/checks/cleared"       },
  { label:"Pending Corrections",   icon:"🔧", href:"/qc/corrections/pending"  },
  { label:"Working on Corrections",icon:"✏️", href:"/qc/corrections/active"   },
  { label:"Corrections Sent",      icon:"📨", href:"/qc/corrections/done"     },
  { label:"Earnings",              icon:"💰", href:"/qc/earnings"             },
  { label:"Withdraw",              icon:"🏦", href:"/qc/withdraw"             },
  { label:"Notifications",         icon:"🔔", href:"/qc/notifications"        },
  { label:"Profile",               icon:"👤", href:"/qc/profile"              },
];

const DEG:Record<string,string> = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};

export default function QCChecksCleared() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";

  useEffect(()=>{
    fetch("/api/qc/jobs?flow=checks&status=cleared")
      .then(r=>r.json())
      .then(d=>{ if(d.success) setJobs(d.data); })
      .finally(()=>setLoading(false));
  },[]);

  return (
    <StaffLayout navItems={QC_NAV} role="Quality Control" initials={initials}>
      <div style={{maxWidth:"640px",margin:"0 auto"}}>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"1.6rem",fontWeight:800,color:"#0C1A2E",letterSpacing:"-.02em",marginBottom:".25rem"}}>Cleared & Sent</h1>
        <p style={{fontSize:".85rem",color:"#5B7EA6",marginBottom:"1.5rem"}}>Chapters you've cleared and delivered to students.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={{textAlign:"center",padding:"4rem 1rem"}}>
            <div style={{fontSize:"2.5rem",marginBottom:".75rem"}}>📭</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:"1rem",fontWeight:700,color:"#0C1A2E"}}>No cleared chapters yet.</div>
          </div>
        ) : jobs.map((job:any)=>(
          <div key={job.id} style={{background:"#fff",borderRadius:"14px",border:"1.5px solid #E0F2FE",padding:"1rem 1.25rem",marginBottom:".6rem"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1rem",marginBottom:".75rem"}}>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:".9rem",fontWeight:700,color:"#0C1A2E"}}>{job.chapterLabel}</div>
                <div style={{fontSize:".75rem",color:"#5B7EA6",marginTop:".2rem"}}>{job.topic}</div>
                <div style={{fontSize:".75rem",color:"#5B7EA6"}}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup}</div>
                {job.qcClearedAt&&<div style={{fontSize:".72rem",color:"#5B7EA6",marginTop:".2rem"}}>Cleared: {new Date(job.qcClearedAt).toLocaleDateString("en-NG")}</div>}
              </div>
              <span style={{display:"inline-flex",padding:"3px 10px",borderRadius:"999px",fontSize:".68rem",fontWeight:700,background:"#D1FAE5",color:"#065F46",flexShrink:0}}>Delivered ✓</span>
            </div>
            <div style={{display:"flex",gap:"1rem"}}>
              {job.submittedFileUrl&&<a href={job.submittedFileUrl} target="_blank" rel="noreferrer" style={{fontSize:".75rem",fontWeight:600,color:"#5B7EA6",textDecoration:"none"}}>📄 Original</a>}
              {job.deliveredFileUrl&&<a href={job.deliveredFileUrl} target="_blank" rel="noreferrer" style={{fontSize:".75rem",fontWeight:600,color:"#0369A1",textDecoration:"none"}}>✅ Cleared Version</a>}
            </div>
          </div>
        ))}
      </div>
    </StaffLayout>
  );
}
