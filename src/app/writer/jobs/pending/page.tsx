"use client";
// src/app/writer/jobs/pending/page.tsx

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { JobCard } from "@/components/staff/JobCard";
import { Spinner } from "@/components/ui";
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

export default function WriterPendingJobs() {
  const { data: session } = useSession();
  const router  = useRouter();
  const [jobs,    setJobs]    = useState<StaffJobView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/staff/jobs?status=pending&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    if (data.success) setJobs(data.data);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  function handleStarted(jobId: string) {
    // Remove from pending list and navigate to active
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    router.push("/writer/jobs/active");
  }

  function handleRejected(jobId: string) {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }

  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "WR";
  const nav = WRITER_NAV.map((item) =>
    item.href === "/writer/jobs/pending" ? { ...item, badge: jobs.length } : item
  );

  return (
    <StaffLayout navItems={nav} role="Writer" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">
          Pending Jobs
        </h1>
        <p className="text-sm text-navy-muted mb-5">
          Jobs assigned to you that haven't been started yet.
        </p>

        {/* Search */}
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
            <div className="text-4xl mb-3">📭</div>
            <p className="text-navy-muted font-600">No pending jobs right now.</p>
            <p className="text-sm text-navy-muted mt-1">New jobs will appear here when assigned to you.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                {...job}
                planName={job.planName || "STANDARD"}
                onStarted={() => handleStarted(job.id)}
                onRejected={() => handleRejected(job.id)}
              />
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
