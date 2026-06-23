"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";

const NAV = [
  { label:"Dashboard",    icon:"📊", href:"/writer/dashboard" },
  { label:"Pending Jobs", icon:"📋", href:"/writer/jobs/pending" },
  { label:"Active Jobs",  icon:"✍️", href:"/writer/jobs/active" },
  { label:"Corrections",  icon:"🔧", href:"/writer/corrections" },
  { label:"Delivered",    icon:"✅", href:"/writer/jobs/delivered" },
  { label:"Earnings",     icon:"💰", href:"/writer/earnings" },
  { label:"Withdraw",     icon:"🏦", href:"/writer/withdraw" },
  { label:"Notifications",icon:"🔔", href:"/writer/notifications" },
  { label:"Profile",      icon:"👤", href:"/writer/profile" },
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

export default function WriterPendingJobs() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting,setStarting]= useState<string|null>(null);
  const [rejecting,setRejecting]=useState<string|null>(null);  // chapterId being confirmed
  const [rejected, setRejected] =useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/staff/jobs?status=pending");
    const data = await res.json();
    if (data.success) setJobs(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function rejectJob(chapterId: string) {
    setRejecting(null);
    const res  = await fetch("/api/chapters/reject", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ chapterId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Job rejected. Admin has been notified.");
      setRejected(prev => new Set([...prev, chapterId]));
    } else {
      toast.error(data.error || "Something went wrong.");
    }
  }

  async function startJob(chapterId: string) {
    setStarting(chapterId);
    const res  = await fetch("/api/chapters/start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/writer/jobs/active");
    } else {
      toast.error(data.error || "Failed to start job." || "Something went wrong");
      setStarting(null);
    }
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"WR";
  const nav = NAV.map(item=>item.href==="/writer/jobs/pending"?{...item,badge:jobs.length}:item);

  return (
    <StaffLayout navItems={nav} role="Writer" initials={initials}>
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
                <div style={C.ctitle}>{job.chapterLabel} {job.isUrgent && <span style={{marginLeft:".4rem",fontSize:".62rem",fontWeight:800,color:"#991B1B",background:"#FEE2E2",padding:"1px 7px",borderRadius:"999px"}}>🚨 URGENT</span>}</div>
                <div style={C.cmeta}>{job.topic}</div>
                <div style={C.cmeta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup}</div>
                <div style={{display:"flex",gap:"1rem",marginTop:".3rem",flexWrap:"wrap" as const}}>
                  <span style={{fontSize:".7rem",color:"#5B7EA6"}}>📅 Ordered: <strong>{job.orderCreatedAt ? new Date(job.orderCreatedAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "—"}</strong></span>
                  <span style={{fontSize:".7rem",color:"#5B7EA6"}}>📌 Assigned: <strong>{job.createdAt ? new Date(job.createdAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : "—"}</strong></span>
                </div>
              </div>
            </div>

            {job.specialInstructions && (
              <div style={C.info}>
                <div style={C.infot}>Student Instructions</div>
                {job.specialInstructions}
              </div>
            )}

            {job.guidelineFileUrl && job.guidelineFileUrl.split(",").map((url:string, i:number) => (
              <a key={i} href={`/api/download/guideline?url=${encodeURIComponent(url.trim())}&label=${encodeURIComponent(job.guidelineFileUrl.split(",").length>1?`Guideline ${i+1} ${job.topic}`:`Guideline ${job.topic}`)}`} target="_blank" rel="noreferrer"
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

            {/* Reject button */}
            {!rejected.has(job.id) && (
              rejecting === job.id ? (
                <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:"10px",padding:".75rem 1rem",marginTop:".75rem",fontSize:".82rem",color:"#991B1B"}}>
                  <strong>Are you sure you want to reject this job?</strong> Admin will be notified and it will be reassigned.
                  <div style={{display:"flex",gap:".5rem",marginTop:".6rem"}}>
                    <button
                      style={{padding:".4rem 1rem",borderRadius:"8px",background:"#DC2626",color:"#fff",fontSize:".78rem",fontWeight:700,border:"none",cursor:"pointer"}}
                      onClick={()=>rejectJob(job.id)}>
                      Yes, Reject
                    </button>
                    <button
                      style={{padding:".4rem 1rem",borderRadius:"8px",background:"#F1F5F9",color:"#64748B",fontSize:".78rem",fontWeight:700,border:"none",cursor:"pointer"}}
                      onClick={()=>setRejecting(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  style={{width:"100%",padding:".65rem",borderRadius:"10px",border:"1.5px solid #FECACA",background:"transparent",color:"#DC2626",fontSize:".82rem",fontWeight:700,cursor:"pointer",marginTop:".5rem"}}
                  onClick={()=>setRejecting(job.id)}>
                  ✕ Reject Job
                </button>
              )
            )}
            {rejected.has(job.id) && (
              <div style={{textAlign:"center" as const,padding:".75rem",fontSize:".78rem",color:"#5B7EA6",background:"#F8FAFC",borderRadius:"10px",marginTop:".5rem"}}>
                ✓ Job rejected — admin notified
              </div>
            )}
          </div>
        ))}
      </div>
    </StaffLayout>
  );
}
