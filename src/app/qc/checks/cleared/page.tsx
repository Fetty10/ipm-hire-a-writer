"use client";
export const dynamic = "force-dynamic";
// src/app/qc/checks/cleared/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Spinner } from "@/components/ui";
import toast from "react-hot-toast";
import { QC_NAV } from "../../_nav";

const DEG: Record<string,string> = {
  OND_HND_NCE:"HND/OND/NCE", BSC_BED_BA:"BSc/BEd/BA",
  PGD_MSC_PHD:"PGD/MSc", PHD:"PhD",
};

const C = {
  pg:    { display:"flex", gap:".5rem", justifyContent:"center", marginTop:"1.5rem", flexWrap:"wrap" as const },
  pgBtn: { padding:".4rem .9rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", fontSize:".8rem",
           fontWeight:700, cursor:"pointer", background:"#fff", color:"#0C1A2E" },
  pgA:   { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  pgD:   { opacity:.4, cursor:"not-allowed" as const },
};

export default function QCChecksCleared() {
  const { data: session } = useSession();
  const [jobs,         setJobs]         = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [total,        setTotal]        = useState(0);
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
        if (res.ok) { toast.success("Resubmitted successfully."); }
        else toast.error(data.error || "Resubmit failed.");
      } catch { toast.error("Something went wrong."); }
      finally { setResubmitting(null); }
    };
    inp.click();
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/qc/jobs?flow=checks&status=cleared&search=${encodeURIComponent(search)}&page=${page}`);
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

  const initials = (session?.user?.name||"QC").split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase()||"QC";

  return (
    <StaffLayout navItems={QC_NAV||[]} role="Quality Control" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Cleared & Sent</h1>
        <p className="text-sm text-navy-muted mb-1">Chapters you've cleared and delivered to students.</p>
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
            <div className="text-4xl mb-3">📭</div>
            <p className="text-navy-muted font-600">No cleared chapters yet.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {jobs.map((job:any) => (
                <div key={job.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-700 text-navy-DEFAULT">{job.chapterLabel}</p>
                      <p className="text-xs text-navy-muted truncate">{job.topic}</p>
                      <p className="text-xs text-navy-muted mt-0.5">
                        {job.department} · {DEG[job.degreeGroup]||job.degreeGroup}
                        {job.qcClearedAt ? ` · Cleared ${new Date(job.qcClearedAt).toLocaleDateString("en-NG")}` : ""}
                      </p>
                      {(job.plagiarismScore != null || job.aiScore != null) && (
                        <div className="flex gap-2 mt-1">
                          {job.plagiarismScore != null && <span className="text-[.65rem] font-700 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Plag: {job.plagiarismScore}%</span>}
                          {job.aiScore        != null && <span className="text-[.65rem] font-700 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">AI: {job.aiScore}%</span>}
                        </div>
                      )}
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-green-50 text-green-700">Cleared ✓</span>
                  </div>
                  {job.adminNotes && (
                    <p className="text-xs text-navy-muted mt-2 pt-2 border-t border-sky-100">📝 {job.adminNotes}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <a href={`/api/download?chapterId=${job.id}`} target="_blank" rel="noreferrer"
                      className="text-xs font-700 text-sky-600 hover:underline">
                      ⬇ Download Cleared File
                    </a>
                    <button disabled={resubmitting === job.id} onClick={() => handleResubmit(job)}
                      style={{fontSize:".72rem",fontWeight:700,color:"#5B21B6",background:"#EDE9FE",border:"none",borderRadius:"8px",padding:"3px 10px",cursor:"pointer",whiteSpace:"nowrap" as const,opacity:resubmitting===job.id?0.5:1}}>
                      {resubmitting === job.id ? "Uploading..." : "↩ Resubmit"}
                    </button>
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
