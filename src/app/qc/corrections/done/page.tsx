"use client";
// src/app/qc/corrections/done/page.tsx
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Spinner } from "@/components/ui";
import { QC_NAV } from "../../_nav";

interface DoneJob { id:string; chapterLabel:string; topic:string; department:string; degreeGroup:string; qcClearedAt:string|null; correctionNotes:string|null; }
const DEG: Record<string,string> = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};

export default function QCCorrectionsDone() {
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<DoneJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/qc/jobs?flow=corrections&status=cleared")
      .then(r => r.json()).then(d => { if(d.success) setJobs(d.data); setLoading(false); });
  }, []);

  const initials = session?.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  return (
    <StaffLayout navItems={QC_NAV} role="Quality Control" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Corrections Sent</h1>
        <p className="text-sm text-navy-muted mb-5">Corrections you've completed and sent back to students.</p>
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        : jobs.length === 0 ? <div className="text-center py-16"><div className="text-4xl mb-3">📭</div><p className="text-navy-muted font-600">No corrections completed yet.</p></div>
        : <div className="flex flex-col gap-3">{jobs.map(job => (
          <Card key={job.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-700 text-navy-DEFAULT">{job.chapterLabel}</p>
              <p className="text-xs text-navy-muted truncate">{job.topic}</p>
              <p className="text-xs text-navy-muted">{job.department} · {DEG[job.degreeGroup]}{job.qcClearedAt && ` · ${new Date(job.qcClearedAt).toLocaleDateString("en-NG")}`}</p>
            </div>
            <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-green-50 text-green-700">Sent ✓</span>
          </Card>
        ))}</div>}
      </div>
    </StaffLayout>
  );
}
