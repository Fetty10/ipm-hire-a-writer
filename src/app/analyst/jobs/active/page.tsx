"use client";
// src/app/analyst/jobs/active/page.tsx

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { JobCard } from "@/components/staff/JobCard";
import { Spinner } from "@/components/ui";
import type { StaffJobView } from "@/types";

const WRITER_NAV = [
  { label: "Dashboard",     icon: "📊", href: "/analyst/dashboard"    },
  { label: "Pending Jobs",  icon: "📋", href: "/analyst/jobs/pending"  },
  { label: "Active Jobs",   icon: "✍️", href: "/analyst/jobs/active"   },
  { label: "Delivered",     icon: "✅", href: "/analyst/jobs/delivered" },
  { label: "Earnings",      icon: "💰", href: "/analyst/earnings"      },
  { label: "Withdraw",      icon: "🏦", href: "/analyst/withdraw"      },
  { label: "Notifications", icon: "🔔", href: "/analyst/notifications" },
  { label: "Profile",       icon: "👤", href: "/analyst/profile"       },
];

export default function AnalystActiveJobs() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<StaffJobView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/staff/jobs?status=active&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if (data.success) setJobs(data.data);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function handleSubmitted(jobId: string) {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }

  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "WR";
  const nav = WRITER_NAV.map((item) =>
    item.href === "/analyst/jobs/active" ? { ...item, badge: jobs.length } : item
  );

  return (
    <StaffLayout navItems={nav} role="Analyst" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">
          Active Jobs
        </h1>
        <p className="text-sm text-navy-muted mb-5">
          Jobs you've started — upload and submit when complete.
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
            <div className="text-4xl mb-3">✍️</div>
            <p className="text-navy-muted font-600">No active jobs.</p>
            <p className="text-sm text-navy-muted mt-1">Start a job from Pending Jobs to see it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                {...job}
                planName={job.planName || "STANDARD"}
                onSubmitted={() => handleSubmitted(job.id)}
              />
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
