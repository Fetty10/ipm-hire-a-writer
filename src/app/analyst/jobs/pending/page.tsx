"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

const C = {
  page:   { maxWidth:"640px", margin:"0 auto" },
  h1:     { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:    { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.5rem" },
  card:   { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  chead:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  ctitle: { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  cmeta:  { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  info:   { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".82rem", color:"#0C1A2E", lineHeight:1.5 },
  infot:  { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".3rem" },
  notice: { background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".78rem", color:"#9A3412", lineHeight:1.5 },
  btnP:   { padding:".65rem 1.25rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", width:"100%" },
  btnPd:  { opacity:.5, cursor:"not-allowed" as const },
  empty:  { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon:  { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle: { fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  esub:   { fontSize:".83rem", color:"#5B7EA6", marginTop:".3rem" },
};

const DEG:Record<string,string>  = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc"};
const PLAN:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Pro"};

export default function AnalystPendingJobs() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting,setStarting]= useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/staff/jobs?status=pending");
    const data = await res.json();
    if (data.success) setJobs(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startJob(chapterId: string) {
    setStarting(chapterId);
    const res  = await fetch("/api/chapters/start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/analyst/jobs/active");
    } else {
      toast.error(data.error || "Failed to start job." || "Something went wrong");
      setStarting(null);
    }
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"AN";
  const nav = NAV.map(item=>item.href==="/analyst/jobs/pending"?{...item,badge:jobs.length}:item);

  return (
    <StaffLayout navItems={nav} role="Analyst" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Pending Jobs</h1>
        <p style={C.sub}>Jobs assigned to you. Start a job to begin the 3-working-day countdown.</p>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>📋</div>
            <div style={C.etitle}>No pending jobs.</div>
            <div style={C.esub}>New assignments will appear here.</div>
          </div>
        ) : jobs.map((job:any) => (
          <div key={job.id} style={C.card}>
            <div style={C.chead}>
              <div>
                <div style={C.ctitle}>{job.chapterLabel}</div>
                <div style={C.cmeta}>{job.topic}</div>
                <div style={C.cmeta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup} · {PLAN[job.planName]||job.planName}</div>
              </div>
            </div>

            {job.specialInstructions && (
              <div style={C.info}>
                <div style={C.infot}>Student Instructions</div>
                {job.specialInstructions}
              </div>
            )}

            {job.guidelineFileUrl && job.guidelineFileUrl.split(",").map((url:string, i:number) => (
              <a key={i} href={url.trim()} target="_blank" rel="noreferrer"
                style={{display:"inline-flex",alignItems:"center",gap:".3rem",fontSize:".78rem",fontWeight:600,color:"#0369A1",textDecoration:"none",marginBottom:"1rem",marginRight:"1rem"}}>
                📎 {job.guidelineFileUrl.split(",").length>1?`Guideline ${i+1}`:"Download Guideline"}
              </a>
            ))}

            <div style={C.notice}>
              ⏱ Once you click <strong>Start Job</strong>, your 3-working-day deadline begins immediately. Only start when you are ready to work on it.
            </div>

            <button
              style={{...C.btnP,...(starting===job.id?C.btnPd:{})}}
              disabled={starting===job.id}
              onClick={()=>startJob(job.id)}>
              {starting===job.id ? "Starting..." : "▶ Start Job →"}
            </button>
          </div>
        ))}
      </div>
    </StaffLayout>
  );
}
