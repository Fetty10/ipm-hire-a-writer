"use client";
// src/app/writer/jobs/delivered/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Spinner } from "@/components/ui";
import { DegreeGroup, PlanName } from "@prisma/client";
import type { StaffJobView } from "@/types";

const WRITER_NAV = [
  { label: "Dashboard",     icon: "📊", href: "/writer/dashboard"    },
  { label: "Pending Jobs",  icon: "📋", href: "/writer/jobs/pending"  },
  { label: "Active Jobs",   icon: "✍️", href: "/writer/jobs/active"   },
  { label: "Delivered",     icon: "✅", href: "/writer/jobs/delivered" },
  { label: "Earnings",      icon: "💰", href: "/writer/earnings"      },
  { label: "Withdraw",      icon: "🏦", href: "/writer/withdraw"      },
  { label: "Notifications", icon: "🔔", href: "/writer/notifications" },
  { label: "Profile",       icon: "👤", href: "/writer/profile"       },
];

const DEG_LABELS: Record<DegreeGroup, string> = {
  OND_HND_NCE: "HND/OND/NCE",
  BSC_BED_BA:  "BSc/BEd/BA",
  PGD_MSC_PHD: "PGD/MSc/PhD",
};

export default function WriterDeliveredJobs() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<StaffJobView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    async function load() {
      const res  = await fetch(`/api/staff/jobs?status=delivered&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) setJobs(data.data);
      setLoading(false);
    }
    load();
  }, [search]);

  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "WR";

  return (
    <StaffLayout navItems={WRITER_NAV} role="Writer" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">
          Delivered Jobs
        </h1>
        <p className="text-sm text-navy-muted mb-5">
          All chapters you've completed and delivered.
        </p>

        <div className="relative mb-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-muted text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-navy-muted font-600">No delivered jobs yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <Card key={job.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-green-50 text-green-700 font-clash font-800 text-xs flex items-center justify-center flex-shrink-0 border border-green-200">
                    {job.chapterNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-600 text-navy-DEFAULT truncate">{job.chapterLabel}</p>
                    <p className="text-xs text-navy-muted truncate">{job.topic}</p>
                    <p className="text-xs text-navy-muted">
                      {job.department} · {DEG_LABELS[job.degreeGroup]} ·{" "}
                      {job.deliveredAt ? new Date(job.deliveredAt).toLocaleDateString("en-NG") : ""}
                    </p>
                  </div>
                </div>
                <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-green-50 text-green-700">
                  Delivered ✓
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
