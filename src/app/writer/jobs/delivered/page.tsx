"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useCallback } from "react";
import { StaffLayout } from "@/components/staff/StaffLayout";

import toast from "react-hot-toast";

const DEG:Record<string,string> = { OND_HND_NCE:"HND/OND", BSC_BED_BA:"BSc/BEd", PGD_MSC_PHD:"PGD/MSc", PHD:"PhD" };

const C = {
  pg:    { display:"flex", gap:".4rem", justifyContent:"center", marginTop:"1rem" },
  pgBtn: { padding:".4rem .75rem", borderRadius:"8px", border:"1.5px solid #BAE6FD", background:"#fff", fontSize:".78rem", fontWeight:600, cursor:"pointer", color:"#0C1A2E" },
  pgA:   { background:"#0C1A2E", color:"#38BDF8", borderColor:"#0C1A2E" },
  pgD:   { opacity:.4, cursor:"not-allowed" as const },
};

function StatusBadge({ status, qcStarted }: { status:string; qcStarted?:boolean }) {
  const map:Record<string,[string,string]> = {
    SUBMITTED:     ["#FEF9C3","#854D0E"],
    QC_IN_PROGRESS:["#EDE9FE","#5B21B6"],
    QC_CLEARED:    ["#D1FAE5","#065F46"],
    DELIVERED:     ["#D1FAE5","#065F46"],
  };
  const [bg,col] = map[status] || ["#F1F5F9","#64748B"];
  const label = status === "DELIVERED" ? (qcStarted ? "QC Cleared" : "Delivered") : status.replace(/_/g," ");
  return <span style={{background:bg,color:col,fontSize:".65rem",fontWeight:700,padding:"2px 8px",borderRadius:"999px",whiteSpace:"nowrap" as const}}>{label}</span>;
}

export default function WriterDelivered() {
  const [jobs,         setJobs]         = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [resubmitting, setResubmitting] = useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/staff/jobs?status=delivered&search=${encodeURIComponent(search)}&page=${page}`);
    const data = await res.json();
    if (data.success) { setJobs(data.data); setPages(data.pages||1); }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

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
      } catch { toast.error("Something went wrong. Please try again."); }
      finally { setResubmitting(null); }
    };
    inp.click();
  }

  return (
    <StaffLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Delivered Work</h1>
        <p className="text-sm text-navy-muted mb-4">Your submitted and delivered chapters.</p>

        <input className="w-full p-2.5 rounded-xl border border-sky-100 text-sm mb-4 outline-none"
          placeholder="Search by topic..." value={search}
          onChange={e=>{ setSearch(e.target.value); setPage(1); }} />

        {loading ? <p className="text-sm text-navy-muted text-center py-8">Loading...</p>
        : jobs.length === 0 ? <p className="text-sm text-navy-muted text-center py-8">No delivered chapters yet.</p>
        : (
          <>
            <div className="flex flex-col gap-3">
              {jobs.map(job => (
                <div key={job.id} className="card flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 font-800 font-clash text-sm flex-shrink-0">
                      {job.chapterLabel?.replace("Chapter ","Ch")||"?"}
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
                    <StatusBadge status={job.status} qcStarted={job.qcStarted} />
                    <a href={`/api/download?chapterId=${job.id}`} target="_blank" rel="noreferrer"
                      className="text-xs font-700 text-sky-600 hover:underline whitespace-nowrap">
                      ⬇ Download
                    </a>
                    {job.status !== "QC_CLEARED" && (
                      <button
                        disabled={resubmitting === job.id}
                        onClick={() => handleResubmit(job)}
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
