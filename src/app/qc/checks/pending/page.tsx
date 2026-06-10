"use client";
// src/app/qc/checks/pending/page.tsx

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Spinner, Button } from "@/components/ui";
import { QC_NAV } from "../../_nav";
import toast from "react-hot-toast";

interface QCJob {
  id: string; chapterLabel: string; chapterNumber: number;
  topic: string; department: string; degreeGroup: string; planName: string;
  requiresPlagiarism: boolean; requiresAI: boolean;
  submittedFileUrl: string | null; routedToQcAt: string | null;
}

export default function QCChecksPending() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs,    setJobs]    = useState<QCJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/qc/jobs?flow=checks&status=pending&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if (data.success) setJobs(data.data);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function handleStart(jobId: string) {
    setStarting(jobId);
    const res  = await fetch("/api/qc/start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId: jobId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Check started!");
      setJobs(prev => prev.filter(j => j.id !== jobId));
      router.push("/qc/checks/active");
    } else {
      toast.error(data.error);
    }
    setStarting(null);
  }

  async function handleReject(jobId: string) {
    setRejecting(jobId);
    const res  = await fetch("/api/chapters/reject", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId: jobId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } else {
      toast.error(data.error);
    }
    setRejecting(null);
    setConfirmReject(null);
  }

  const DEG: Record<string,string> = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};
  const initials = session?.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = QC_NAV.map(item => item.href==="/qc/checks/pending" ? {...item,badge:jobs.length} : item);

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Pending Checks</h1>
        <p className="text-sm text-navy-muted mb-5">Professional plan chapters awaiting AI & plagiarism checks.</p>

        <div className="relative mb-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-muted text-sm">🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by topic..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-navy-muted font-600">No pending checks.</p>
            <p className="text-sm text-navy-muted mt-1">New chapters will appear here when routed to you.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-700 text-navy-DEFAULT">{job.chapterLabel}</h3>
                    <p className="text-xs text-navy-muted mt-1 line-clamp-2">{job.topic}</p>
                    <p className="text-xs text-navy-muted">{job.department} · {DEG[job.degreeGroup]} · Professional Plan</p>
                    {job.routedToQcAt && (
                      <p className="text-xs text-navy-muted">
                        Routed: {new Date(job.routedToQcAt).toLocaleDateString("en-NG")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    {job.requiresPlagiarism && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[.65rem] font-700 bg-red-50 text-red-700">Plagiarism Check</span>
                    )}
                    {job.requiresAI && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[.65rem] font-700 bg-purple-50 text-purple-700">AI Check</span>
                    )}
                  </div>
                </div>

                {job.submittedFileUrl && (
                  <a href={job.submittedFileUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-600 text-sky-600 hover:underline mb-4">
                    ⬇ Download Submitted Chapter File
                  </a>
                )}

                {confirmReject === job.id ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-2">
                    <p className="text-sm font-700 text-red-800 mb-1">Are you sure?</p>
                    <p className="text-xs text-red-700 mb-3">This will be reassigned to the next available QC member.</p>
                    <div className="flex gap-2">
                      <Button variant="danger" size="sm" loading={rejecting===job.id} onClick={()=>handleReject(job.id)}>
                        Yes, Reject
                      </Button>
                      <Button variant="ghost" size="sm" onClick={()=>setConfirmReject(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="primary" size="sm" loading={starting===job.id} onClick={()=>handleStart(job.id)}>
                      ▶ Start Check
                    </Button>
                    <Button variant="danger" size="sm" onClick={()=>setConfirmReject(job.id)}>
                      ✕ Reject
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
