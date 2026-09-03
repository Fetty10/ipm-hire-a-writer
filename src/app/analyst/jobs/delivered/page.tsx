"use client";
// src/app/analyst/jobs/delivered/page.tsx
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";

const NAV = [
  { label: "Dashboard",     icon: "📊", href: "/analyst/dashboard"    },
  { label: "Pending Jobs",  icon: "📋", href: "/analyst/jobs/pending"  },
  { label: "Active Jobs",   icon: "✍️", href: "/analyst/jobs/active"   },
  { label: "Corrections",   icon: "🔧", href: "/analyst/corrections"   },
  { label: "Delivered",     icon: "✅", href: "/analyst/jobs/delivered" },
  { label: "Earnings",      icon: "💰", href: "/analyst/earnings"      },
  { label: "Withdraw",      icon: "🏦", href: "/analyst/withdraw"      },
  { label: "Notifications", icon: "🔔", href: "/analyst/notifications" },
  { label: "Profile",       icon: "👤", href: "/analyst/profile"       },
];

const DEG: Record<string,string> = {
  OND_HND_NCE:"HND/OND/NCE", BSC_BED_BA:"BSc/BEd/BA",
  PGD_MSC_PHD:"PGD/MSc", PHD:"PhD",
};

const C = {
  pg:   { display:"flex", gap:".5rem", justifyContent:"center", marginTop:"1.5rem", flexWrap:"wrap" as const },
  pgBtn:{ padding:".4rem .9rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".8rem",
           fontWeight:700, cursor:"pointer", background:"#fff", color:"#0C1A2E" },
  pgA:  { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  pgD:  { opacity:.4, cursor:"not-allowed" as const },
};

export default function AnalystDeliveredJobs() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  const [resubmitting, setResubmitting] = useState<string|null>(null);

  async function handleResubmit(job: any) {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".pdf,.doc,.docx";
    inp.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) { toast.error("Max 20MB"); return; }
      setResubmitting(job.id);
      try {
        const fd = new FormData(); fd.append("file", file); fd.append("folder", "chapters/submitted");
        const upRes  = await fetch("/api/upload", { method:"POST", body:fd });
        const upData = await upRes.json();
        if (!upRes.ok) { toast.error(upData.error || "Upload failed."); return; }
        const res  = await fetch("/api/chapters/resubmit", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ chapterId: job.id, fileUrl: upData.url }),
        });
        const data = await res.json();
        if (res.ok) { toast.success("Resubmitted successfully."); load(); }
        else toast.error(data.error || "Resubmit failed.");
      } catch { toast.error("Something went wrong."); }
      finally { setResubmitting(null); }
    };
    inp.click();
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/staff/jobs?status=delivered&search=${encodeURIComponent(search)}&page=${page}`);
    const data = await res.json();
    if (data.success) {
      setJobs(data.data||[]);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { load(); }, [load]);

  const initials = session?.user?.name?.split(" ").map((n:string) => n[0]).join("").slice(0,2).toUpperCase() || "AN";

  return (
    <StaffLayout navItems={NAV} role="Analyst" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Submitted Jobs</h1>
        <p className="text-sm text-navy-muted mb-1">All chapters you've submitted — including those awaiting QC or already delivered.</p>
        {total > 0 && <p className="text-xs text-navy-muted mb-4">{total} chapter{total!==1?"s":""} total</p>}

        <div className="relative mb-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-muted text-sm">🔍</span>
          <input type="text" placeholder="Search by topic..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>

        ) : loading ? (
          <div style={{textAlign:"center",padding:"3rem",color:"#5B7EA6"}}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-navy-muted font-600">No submitted jobs yet.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {jobs.map((job:any) => (
                <div key={job.id} className="card flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-green-50 text-green-700 font-clash font-800 text-xs flex items-center justify-center flex-shrink-0 border border-green-200">
                      {job.chapterNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-600 text-navy-DEFAULT truncate">{job.chapterLabel}</p>
                      <p className="text-xs text-navy-muted truncate">{job.topic}</p>
                      <p className="text-xs text-navy-muted">
                        {job.department} · {DEG[job.degreeGroup]||job.degreeGroup} ·{" "}
                        {job.deliveredAt ? new Date(job.deliveredAt).toLocaleDateString("en-NG") : job.submittedAt ? new Date(job.submittedAt).toLocaleDateString("en-NG") : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{padding:"2px 10px",borderRadius:"999px",fontSize:".7rem",fontWeight:700,
                      background: job.status==="DELIVERED"?"#D1FAE5":job.status==="QC_IN_PROGRESS"?"#EDE9FE":"#E0F2FE",
                      color: job.status==="DELIVERED"?"#065F46":job.status==="QC_IN_PROGRESS"?"#5B21B6":"#0369A1"}}>
                      {job.status.replace(/_/g," ")}
                    </span>
                    <a href={`/api/download?chapterId=${job.id}`} target="_blank" rel="noreferrer"
                      className="text-xs font-700 text-sky-600 hover:underline whitespace-nowrap">
                      ⬇ Download
                    </a>
                    {job.status !== "QC_CLEARED" && (
                      <button disabled={resubmitting === job.id} onClick={() => handleResubmit(job)}
                        style={{fontSize:".72rem",fontWeight:700,color:"#5B21B6",background:"#EDE9FE",border:"none",borderRadius:"8px",padding:"3px 10px",cursor:"pointer",whiteSpace:"nowrap" as const,opacity:resubmitting===job.id?0.5:1}}>
                        {resubmitting === job.id ? "Uploading..." : "↩ Resubmit"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pages > 1 && (
              <div style={C.pg}>
                <button style={{...C.pgBtn,...(page===1?C.pgD:{})}} disabled={page===1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
                {Array.from({length:pages},(_,i)=>i+1).map(p=>(
                  <button key={p} style={{...C.pgBtn,...(p===page?C.pgA:{})}} onClick={()=>setPage(p)}>{p}</button>
                ))}
                <button style={{...C.pgBtn,...(page===pages?C.pgD:{})}} disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </StaffLayout>
  );
}
