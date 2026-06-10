"use client";
// src/app/qc/checks/cleared/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Spinner } from "@/components/ui";
import { QC_NAV } from "../../_nav";

interface ClearedJob {
  id: string; chapterLabel: string; topic: string;
  department: string; degreeGroup: string; qcClearedAt: string | null;
  adminNotes: string | null;
}

const DEG: Record<string,string> = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};

export default function QCChecksCleared() {
  const { data: session } = useSession();
  const [jobs, setJobs]     = useState<ClearedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res  = await fetch("/api/qc/jobs?flow=checks&status=cleared");
      const data = await res.json();
      if (data.success) setJobs(data.data);
      setLoading(false);
    }
    load();
  }, []);

  const initials = session?.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"QC";

  return (
    <StaffLayout navItems={QC_NAV} role="Quality Control" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Cleared & Sent</h1>
        <p className="text-sm text-navy-muted mb-5">Chapters you've cleared and delivered to students.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-navy-muted font-600">No cleared chapters yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <Card key={job.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-700 text-navy-DEFAULT">{job.chapterLabel}</p>
                  <p className="text-xs text-navy-muted truncate">{job.topic}</p>
                  <p className="text-xs text-navy-muted">
                    {job.department} · {DEG[job.degreeGroup]}
                    {job.qcClearedAt && ` · Cleared ${new Date(job.qcClearedAt).toLocaleDateString("en-NG")}`}
                  </p>
                  {job.adminNotes && (
                    <p className="text-xs text-sky-600 mt-1">{job.adminNotes}</p>
                  )}
                </div>
                <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-green-50 text-green-700">
                  Cleared ✓
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
