"use client";
// src/app/qc/corrections/pending/page.tsx

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Spinner, Button } from "@/components/ui";
import { QC_NAV } from "../../_nav";
import toast from "react-hot-toast";

interface CorrJob {
  id: string; chapterLabel: string; topic: string;
  department: string; degreeGroup: string; planName: string;
  correctionNotes: string | null; submittedFileUrl: string | null;
  adminNotes: string | null; routedToQcAt: string | null;
}

const DEG: Record<string,string> = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};

export default function QCCorrectionsPending() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs, setJobs]     = useState<CorrJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string|null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/qc/jobs?flow=corrections&status=pending");
    const data = await res.json();
    if (data.success) setJobs(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStart(jobId: string) {
    setStarting(jobId);
    const res  = await fetch("/api/qc/start", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId: jobId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Started working on correction.");
      setJobs(prev => prev.filter(j => j.id !== jobId));
      router.push("/qc/corrections/active");
    } else { toast.error(data.error); }
    setStarting(null);
  }

  // Extract supervisor notes URL from adminNotes field
  function getSupervisorNotesUrl(adminNotes: string | null): string | null {
    if (!adminNotes) return null;
    const match = adminNotes.match(/supervisor_notes:(.+)/);
    return match ? match[1] : null;
  }

  const initials = session?.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = QC_NAV.map(item => item.href==="/qc/corrections/pending" ? {...item,badge:jobs.length} : item);

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Pending Corrections</h1>
        <p className="text-sm text-navy-muted mb-4">Student correction requests — you handle them before sending back.</p>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 mb-5 text-xs text-sky-800">
          ℹ Your job is to make the corrections based on the student's request and send back. Only escalate to the writer if the issue is content-level.
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-navy-muted font-600">No pending correction requests.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => {
              const supervisorUrl = getSupervisorNotesUrl(job.adminNotes);
              return (
                <Card key={job.id}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-700 text-navy-DEFAULT">{job.chapterLabel}</h3>
                      <p className="text-xs text-navy-muted mt-1">{job.topic}</p>
                      <p className="text-xs text-navy-muted">
                        {job.department} · {DEG[job.degreeGroup]}
                        {job.routedToQcAt && ` · ${new Date(job.routedToQcAt).toLocaleDateString("en-NG")}`}
                      </p>
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-orange-50 text-orange-700">
                      Correction Needed
                    </span>
                  </div>

                  {/* Student's request */}
                  {job.correctionNotes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                      <p className="text-xs font-700 text-yellow-800 uppercase tracking-wider mb-1.5">
                        Student's Correction Request
                      </p>
                      <p className="text-sm text-yellow-900 leading-relaxed">{job.correctionNotes}</p>
                    </div>
                  )}

                  {/* Files */}
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 mb-4">
                    <p className="text-xs font-700 text-sky-700 uppercase tracking-wider mb-2">Files to Work From</p>
                    <div className="flex flex-col gap-1.5">
                      {job.submittedFileUrl && (
                        <a href={job.submittedFileUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-600 text-sky-600 hover:underline">
                          ⬇ Download {job.chapterLabel} (Delivered Version)
                        </a>
                      )}
                      {supervisorUrl && (
                        <a href={supervisorUrl} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-600 text-sky-600 hover:underline">
                          ⬇ Download Supervisor's Notes (from student)
                        </a>
                      )}
                    </div>
                  </div>

                  <Button variant="primary" loading={starting===job.id} onClick={() => handleStart(job.id)}>
                    ✏️ Work on this Correction →
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
