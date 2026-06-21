"use client";
// src/app/writer/jobs/jobs/delivered/page.tsx
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Spinner } from "@/components/ui";
import { StatusBadge } from "@/components/ui";

const NAV = [
  { label: "Dashboard",     icon: "📊", href: "/writer/dashboard"    },
  { label: "Pending Jobs",  icon: "📋", href: "/writer/jobs/pending"  },
  { label: "Active Jobs",   icon: "✍️", href: "/writer/jobs/active"   },
  { label: "Corrections",   icon: "🔧", href: "/writer/corrections"   },
  { label: "Delivered",     icon: "✅", href: "/writer/jobs/delivered" },
  { label: "Earnings",      icon: "💰", href: "/writer/earnings"      },
  { label: "Withdraw",      icon: "🏦", href: "/writer/withdraw"      },
  { label: "Notifications", icon: "🔔", href: "/writer/notifications" },
  { label: "Profile",       icon: "👤", href: "/writer/profile"       },
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

export default function WriterDeliveredJobs() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/staff/jobs?status=delivered&search=${encodeURIComponent(search)}&page=${page}`);
    const data = await res.json();
    if (data.success) {
      setJobs(data.data);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { load(); }, [load]);

  const initials = session?.user?.name?.split(" ").map((n:string) => n[0]).join("").slice(0,2).toUpperCase() || "WR";

  return (
    <StaffLayout navItems={NAV} role="Writer" initials={initials}>
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

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-navy-muted font-600">No submitted jobs yet.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {jobs.map((job:any) => (
                <Card key={job.id} className="flex items-center justify-between gap-3">
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
                  <StatusBadge status={job.status} qcStarted={job.qcStarted} />
                </Card>
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
