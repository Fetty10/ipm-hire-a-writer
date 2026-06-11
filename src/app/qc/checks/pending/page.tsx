"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

const C = {
  page:  { maxWidth:"640px", margin:"0 auto" },
  h1:    { fontFamily:"'Syne',sans-serif", fontSize:"1.6rem", fontWeight:800, color:"#0C1A2E", letterSpacing:"-.02em", marginBottom:".25rem" },
  sub:   { fontSize:".85rem", color:"#5B7EA6", marginBottom:".75rem" },
  notice:{ background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1.25rem", fontSize:".78rem", color:"#0369A1" },
  card:  { background:"#fff", borderRadius:"16px", border:"1.5px solid #E0F2FE", boxShadow:"0 2px 12px rgba(14,165,233,.06)", padding:"1.25rem", marginBottom:"1rem" },
  head:  { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1rem" },
  title: { fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:700, color:"#0C1A2E" },
  meta:  { fontSize:".75rem", color:"#5B7EA6", marginTop:".25rem" },
  badge: { display:"inline-flex", padding:"3px 10px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, background:"#EDE9FE", color:"#5B21B6", flexShrink:0 as const },
  tags:  { display:"flex", gap:".4rem", flexWrap:"wrap" as const, marginBottom:"1rem" },
  tag:   { padding:"2px 8px", borderRadius:"999px", fontSize:".68rem", fontWeight:700, background:"#FEF9C3", color:"#854D0E" },
  files: { background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:"10px", padding:".75rem 1rem", marginBottom:"1rem" },
  filest:{ fontSize:".65rem", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:".08em", color:"#0369A1", marginBottom:".5rem" },
  flink: { display:"block", fontSize:".78rem", fontWeight:600, color:"#0369A1", textDecoration:"none", marginBottom:".3rem" },
  btnP:  { padding:".65rem 1.25rem", borderRadius:"10px", background:"#38BDF8", color:"#0C1A2E", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btnR:  { padding:".65rem 1.25rem", borderRadius:"10px", background:"#FEE2E2", color:"#991B1B", fontSize:".85rem", fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  btns:  { display:"flex", gap:".5rem" },
  empty: { textAlign:"center" as const, padding:"4rem 1rem" },
  eicon: { fontSize:"2.5rem", marginBottom:".75rem" },
  etitle:{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:700, color:"#0C1A2E" },
  esub:  { fontSize:".83rem", color:"#5B7EA6", marginTop:".3rem" },
};

const DEG:Record<string,string> = {OND_HND_NCE:"HND/OND",BSC_BED_BA:"BSc/BEd",PGD_MSC_PHD:"PGD/MSc"};

export default function QCChecksPending() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting,setStarting]= useState<string|null>(null);
  const [search,  setSearch]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/qc/jobs?flow=checks&status=pending&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if (data.success) setJobs(data.data);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function handleStart(id: string) {
    setStarting(id);
    const res  = await fetch("/api/qc/start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId: id }),
    });
    const data = await res.json();
    if (res.ok) {
      setJobs(prev => prev.filter(j => j.id !== id));
      router.push("/qc/checks/active");
    } else {
      alert(data.error);
    }
    setStarting(null);
  }

  function getGuideUrls(url: string|null) {
    if (!url) return [];
    return url.split(",").map(u => u.trim()).filter(Boolean);
  }

  const initials = session?.user?.name?.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = QC_NAV.map(item => item.href==="/qc/checks/pending" ? {...item, badge:jobs.length} : item);

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div style={C.page}>
        <h1 style={C.h1}>Pending Checks</h1>
        <p style={C.sub}>Professional plan chapters awaiting AI & plagiarism checks.</p>
        <div style={C.notice}>ℹ Download the submitted file, run your checks, then upload the cleared version in Active Checks.</div>

        <div style={{position:"relative", marginBottom:"1.25rem"}}>
          <span style={{position:"absolute",left:".75rem",top:"50%",transform:"translateY(-50%)",fontSize:".85rem"}}>🔍</span>
          <input
            style={{width:"100%",padding:".65rem 1rem .65rem 2.2rem",borderRadius:"10px",border:"1.5px solid #BAE6FD",fontSize:".85rem",fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box" as const}}
            placeholder="Search by topic..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {loading ? <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        : jobs.length===0 ? (
          <div style={C.empty}>
            <div style={C.eicon}>✅</div>
            <div style={C.etitle}>No pending checks.</div>
            <div style={C.esub}>New Professional plan submissions will appear here.</div>
          </div>
        ) : jobs.map((job:any) => {
          const guideUrls = getGuideUrls(job.guidelineFileUrl);
          return (
            <div key={job.id} style={C.card}>
              <div style={C.head}>
                <div>
                  <div style={C.title}>{job.chapterLabel}</div>
                  <div style={C.meta}>{job.topic}</div>
                  <div style={C.meta}>{job.department} · {DEG[job.degreeGroup]||job.degreeGroup} · {job.planName}</div>
                  {job.routedToQcAt && <div style={C.meta}>Received: {new Date(job.routedToQcAt).toLocaleDateString("en-NG")}</div>}
                </div>
                <span style={C.badge}>Pending Check</span>
              </div>

              <div style={C.tags}>
                {job.requiresPlagiarism && <span style={C.tag}>🔍 Plagiarism Check</span>}
                {job.requiresAI && <span style={{...C.tag, background:"#EDE9FE", color:"#5B21B6"}}>🤖 AI Check</span>}
              </div>

              <div style={C.files}>
                <div style={C.filest}>Files</div>
                {job.submittedFileUrl && (
                  <a href={job.submittedFileUrl} target="_blank" rel="noreferrer" style={C.flink}>
                    ⬇ Download Submitted Chapter
                  </a>
                )}
                {guideUrls.length > 0 && guideUrls.map((url:string, i:number) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer" style={C.flink}>
                    📎 Download Guideline {guideUrls.length > 1 ? `File ${i+1}` : "File"}
                  </a>
                ))}
              </div>

              {job.specialInstructions && (
                <div style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:"10px",padding:".75rem 1rem",marginBottom:"1rem",fontSize:".78rem",color:"#0369A1"}}>
                  <div style={{fontSize:".65rem",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:".08em",marginBottom:".3rem"}}>Student Instructions</div>
                  {job.specialInstructions}
                </div>
              )}

              <div style={C.btns}>
                <button style={C.btnP} disabled={starting===job.id} onClick={()=>handleStart(job.id)}>
                  {starting===job.id ? "Starting..." : "▶ Start Check →"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </StaffLayout>
  );
}
