"use client";
// src/app/writer/dashboard/page.tsx

import { useEffect, useState } from "react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, StatusBadge, Spinner } from "@/components/ui";
import type { StaffJobView } from "@/types";

const WRITER_NAV = [
  { label: "Dashboard",    icon: "📊", href: "/writer/dashboard" },
  { label: "Pending Jobs", icon: "📋", href: "/writer/jobs/pending" },
  { label: "Active Jobs",  icon: "✍️", href: "/writer/jobs/active"  },
  { label: "Delivered",    icon: "✅", href: "/writer/jobs/delivered"},
  { label: "Earnings",     icon: "💰", href: "/writer/earnings"     },
  { label: "Withdraw",     icon: "🏦", href: "/writer/withdraw"     },
  { label: "Notifications",icon: "🔔", href: "/writer/notifications"},
  { label: "Profile",      icon: "👤", href: "/writer/profile"      },
];

interface EarningsSummary {
  available:   number;
  pending:     number;
  totalEarned: number;
  withdrawn:   number;
}

export default function WriterDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs,     setJobs]     = useState<StaffJobView[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      const [jobsRes, earningsRes] = await Promise.all([
        fetch("/api/staff/jobs?status=all"),
        fetch("/api/staff/earnings"),
      ]);
      const jobsData     = await jobsRes.json();
      const earningsData = await earningsRes.json();
      if (jobsData.success)     setJobs(jobsData.data);
      if (earningsData.success) setEarnings(earningsData.data.summary);
      setLoading(false);
    }
    load();
  }, []);

  const pending   = jobs.filter((j) => j.status === "NOT_STARTED");
  const active    = jobs.filter((j) => ["IN_PROGRESS","PRELIM_SUBMITTED"].includes(j.status));
  const delivered = jobs.filter((j) => j.status === "DELIVERED");

  // Inject badges into nav
  const nav = WRITER_NAV.map((item) => {
    if (item.href === "/writer/jobs/pending")  return { ...item, badge: pending.length   };
    if (item.href === "/writer/jobs/active")   return { ...item, badge: active.length    };
    return item;
  });

  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "WR";

  return (
    <StaffLayout navItems={nav} role="Writer" initials={initials}>
      <div className="max-w-4xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">
          Writer Dashboard
        </h1>
        <p className="text-sm text-navy-muted mb-5">
          Welcome back, {session?.user?.name?.split(" ")[0]}. Here's your summary.
        </p>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { icon: "📋", val: jobs.length,      label: "All Jobs",     href: "/writer/jobs/pending"  },
                { icon: "⏳", val: pending.length,   label: "Pending Jobs", href: "/writer/jobs/pending"  },
                { icon: "✍️", val: active.length,    label: "Active Jobs",  href: "/writer/jobs/active"   },
                { icon: "✅", val: delivered.length, label: "Delivered",    href: "/writer/jobs/delivered" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  onClick={() => router.push(stat.href)}
                  className="bg-white rounded-2xl border border-sky-100 shadow-card p-4 cursor-pointer hover:border-sky-400 hover:shadow-card-hover transition-all"
                >
                  <div className="text-xl mb-2">{stat.icon}</div>
                  <div className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight leading-none mb-1">
                    {stat.val}
                  </div>
                  <div className="text-xs text-navy-muted">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Earnings + Recent jobs */}
            <div className="grid md:grid-cols-2 gap-4">

              {/* Earnings overview */}
              <div
                className="bg-navy-DEFAULT rounded-2xl p-5 text-white cursor-pointer hover:bg-navy-mid transition-all relative overflow-hidden"
                onClick={() => router.push("/writer/earnings")}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-400/10 rounded-full -translate-y-1/3 translate-x-1/3" />
                <p className="text-xs text-sky-300 uppercase tracking-wider font-700 mb-1">Available Balance</p>
                <p className="font-clash text-3xl font-800 text-white mb-4">
                  ₦{(earnings?.available || 0).toLocaleString()}
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: "Pending",     val: earnings?.pending    || 0 },
                    { label: "Total Earned",val: earnings?.totalEarned || 0 },
                    { label: "Withdrawn",   val: earnings?.withdrawn   || 0 },
                  ].map((e) => (
                    <div key={e.label}>
                      <p className="text-sky-300">{e.label}</p>
                      <p className="font-700 text-white">₦{e.val.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent active jobs */}
              <Card>
                <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-3">
                  Recent Active Jobs
                </h2>
                {active.length === 0 ? (
                  <p className="text-xs text-navy-muted py-4 text-center">No active jobs right now.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {active.slice(0, 3).map((job) => (
                      <div
                        key={job.id}
                        onClick={() => router.push("/writer/jobs/active")}
                        className="flex items-center gap-3 p-3 rounded-xl border border-sky-100 hover:border-sky-300 cursor-pointer transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 font-clash font-800 text-xs flex items-center justify-center flex-shrink-0">
                          {job.chapterNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-600 text-navy-DEFAULT truncate">{job.chapterLabel}</p>
                          <p className="text-xs text-navy-muted truncate">{job.topic}</p>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                    ))}
                    {active.length > 3 && (
                      <button
                        onClick={() => router.push("/writer/jobs/active")}
                        className="text-xs text-sky-600 font-600 text-center py-1 hover:underline"
                      >
                        View all {active.length} active jobs →
                      </button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
}
