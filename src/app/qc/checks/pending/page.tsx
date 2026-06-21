"use client";
import toast from "react-hot-toast";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:"1.25rem" },
  sbar:  { position:"relative" as const, marginBottom:"1.25rem" },
  sinput:{ width:"100%", padding:".65rem 1rem .65rem 2.2rem", borderRadius:"10px", border:"1.5px solid #BAE6FD", fontSize:".85rem", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" as const },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  chead: { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  ctitle:{ fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  cmeta: { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, flexShrink:0 as const },
  bGray: { background:"#F1F5F9", color:"#64748B" },
  info:  { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".78rem", color:"#0369A1" },
  infot: { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".3rem" },
  link:  { display:"inline-flex", alignItems:"center", gap:".3rem", fontSize:".78rem", fontWeight:600, color:"#0369A1", textDecoration:"none", marginBottom:"1rem" },
  warn:  { background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem", fontSize:".78rem", color:"#9A3412" },
  warnt: { fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#9A3412", marginBottom:".3rem" },
  btns:  { display:"flex", gap:".5rem", flexWrap:"wrap" as const },
  btnP:  { padding:".55rem 1.1rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".8rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnR:  { padding:".55rem 1.1rem", borderRadius:"10px", background:"#FEE2E2", color:"#991B1B", fontSize:".8rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnG:  { padding:".55rem 1.1rem", borderRadius:"10px", background:"#F1F5F9", color:"#64748B", fontSize:".8rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E", marginBottom:".3rem" },
  esub:  { fontSize:".83rem", color:"#5B7EA6" },
};

export default function WriterPendingJobs() {
  const { data: session } = useSession();
  const router  = useRouter();
  const [jobs, setJobs]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [starting, setStarting]   = useState<string|null>(null);
  const [rejecting, setRejecting] = useState<string|null>(null);
  const [confirm,  setConfirm]    = useState<string|null>(null);

  const load = useCallback(async()=>{
    setLoading(true);
    const res  = await fetch(`/api/staff/jobs?status=pending&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if(data.success) setJobs(data.data);
    setLoading(false);
  },[search]);

  useEffect(()=>{ load(); },[load]);

  async function handleStart(id:string) {
    setStarting(id);
    const res  = await fetch("/api/chapters/start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chapterId:id})});
    const data = await res.json();
    if(res.ok){ setJobs(prev=>prev.filter(j=>j.id!==id)); router.push("/qc/jobs/active"); }
    else toast.error(data.error || "Something went wrong");
    setStarting(null);
  }

  async function handleReject(id:string) {
    setRejecting(id);
    const res  = await fetch("/api/chapters/reject",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chapterId:id})});
    const data = await res.json();
    if(res.ok){ setJobs(prev=>prev.filter(j=>j.id!==id)); setConfirm(null); }
    else toast.error(data.error || "Something went wrong");
    setRejecting(null);
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"WR";
  const nav = QC_NAV.map(item=>item.href==="/qc/jobs/pending"?{...item,badge:jobs.length}:item);

  const DEG:Record<string,string> = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc"};
  const PLAN:Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Pro"};

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Pending Checks</h1>
        <p style={C.sub}>Jobs assigned to you that haven't been started yet.</p>

        <div style={C.sbar}>
          <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
          <input style={C.sinput} placeholder="Search by topic..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>📭</div>
            <div style={C.etitle}>No pending jobs right now.</div>
            <div style={C.esub}>New jobs will appear here when assigned to you.</div>
          </div>
        ) : jobs.map((job:any)=>(
          <div key={job.id} style={C.card}>
            <div style={C.chead}>
              <div>
                <div style={C.ctitle}>{job.chapterLabel}</div>
                <div style={C.cmeta}>{job.topic}</div>
                <div style={C.cmeta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup} · {PLAN[job.planName]||job.planName}</div>
              </div>
              <span style={{...C.badge,...C.bGray}}>Not Started</span>
            </div>

            {job.specialInstructions && (
              <div style={C.info}>
                <div style={C.infot}>Student Instructions</div>
                {job.specialInstructions}
              </div>
            )}

            {job.guidelineFileUrl && job.guidelineFileUrl.split(",").map((u:string, i:number, arr:string[]) => (
              <a key={i} href={`/api/download/guideline?url=${encodeURIComponent(u.trim())}&label=${encodeURIComponent(`Guideline${arr.length>1?` ${i+1}`:""}`)}`}
                target="_blank" rel="noreferrer" style={C.link}>
                📎 Download Guideline File{arr.length>1?` ${i+1}`:""}
              </a>
            ))}

            {confirm===job.id ? (
              <div style={C.warn}>
                <div style={C.warnt}>Are you sure?</div>
                <p style={{marginBottom:".75rem"}}>This will reassign the job to the next available writer.</p>
                <div style={C.btns}>
                  <button style={C.btnR} disabled={rejecting===job.id} onClick={()=>handleReject(job.id)}>
                    {rejecting===job.id?"Rejecting...":"Yes, Reject"}
                  </button>
                  <button style={C.btnG} onClick={()=>setConfirm(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={C.btns}>
                <button style={C.btnP} disabled={starting===job.id} onClick={()=>handleStart(job.id)}>
                  {starting===job.id?"Starting...":"▶ Start Job"}
                </button>
                <button style={C.btnR} onClick={()=>setConfirm(job.id)}>✕ Reject Job</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </StaffLayout>
  );
}
