"use client";
// src/app/qc/dashboard/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Spinner } from "@/components/ui";
import { QC_NAV } from "../_nav";

export default function QCDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [counts, setCounts] = useState({
    checksP: 0, checksA: 0, checksC: 0,
    corrP: 0, corrA: 0, corrD: 0,
    available: 0, totalEarned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [checksP, checksA, checksC, corrP, corrA, corrD, earn] = await Promise.all([
        fetch("/api/qc/jobs?flow=checks&status=pending").then(r => r.json()),
        fetch("/api/qc/jobs?flow=checks&status=active").then(r => r.json()),
        fetch("/api/qc/jobs?flow=checks&status=cleared").then(r => r.json()),
        fetch("/api/qc/jobs?flow=corrections&status=pending").then(r => r.json()),
        fetch("/api/qc/jobs?flow=corrections&status=active").then(r => r.json()),
        fetch("/api/qc/jobs?flow=corrections&status=cleared").then(r => r.json()),
        fetch("/api/staff/earnings").then(r => r.json()),
      ]);
      setCounts({
        checksP: checksP.data?.length || 0,
        checksA: checksA.data?.length || 0,
        checksC: checksC.data?.length || 0,
        corrP:   corrP.data?.length   || 0,
        corrA:   corrA.data?.length   || 0,
        corrD:   corrD.data?.length   || 0,
        available:  earn.data?.summary?.available  || 0,
        totalEarned:earn.data?.summary?.totalEarned|| 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const nav = QC_NAV.map((item) => {
    if (item.href === "/qc/checks/pending")      return { ...item, badge: counts.checksP };
    if (item.href === "/qc/checks/active")       return { ...item, badge: counts.checksA };
    if (item.href === "/qc/corrections/pending") return { ...item, badge: counts.corrP   };
    if (item.href === "/qc/corrections/active")  return { ...item, badge: counts.corrA   };
    return item;
  });

  const initials = session?.user?.name?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "QC";

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">
          QC Dashboard
        </h1>
        <p className="text-sm text-navy-muted mb-5">
          Welcome back, {session?.user?.name?.split(" ")[0]}. You handle two things here.
        </p>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Two flow cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-5">

              {/* Flow 1 — Checks */}
              <div
                onClick={() => router.push("/qc/checks/pending")}
                className="bg-white rounded-2xl border-2 border-sky-400 shadow-card p-5 cursor-pointer hover:shadow-card-hover transition-all"
              >
                <div className="text-2xl mb-3">🔍</div>
                <h2 className="font-clash text-base font-700 text-navy-DEFAULT mb-1">
                  AI & Plagiarism Checks
                </h2>
                <p className="text-xs text-navy-muted mb-4">
                  Professional plan chapters submitted by writers & analysts — auto-routed to you.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-yellow-50 text-yellow-700">
                    {counts.checksP} Pending
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-sky-100 text-sky-700">
                    {counts.checksA} Active
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-green-50 text-green-700">
                    {counts.checksC} Cleared
                  </span>
                </div>
              </div>

              {/* Flow 2 — Corrections */}
              <div
                onClick={() => router.push("/qc/corrections/pending")}
                className="bg-white rounded-2xl border border-sky-100 shadow-card p-5 cursor-pointer hover:border-sky-300 hover:shadow-card-hover transition-all"
              >
                <div className="text-2xl mb-3">🔧</div>
                <h2 className="font-clash text-base font-700 text-navy-DEFAULT mb-1">
                  Student Corrections
                </h2>
                <p className="text-xs text-navy-muted mb-4">
                  Correction requests from students on delivered work — you handle them first.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-orange-50 text-orange-700">
                    {counts.corrP} Pending
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-yellow-50 text-yellow-700">
                    {counts.corrA} In Progress
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-green-50 text-green-700">
                    {counts.corrD} Done
                  </span>
                </div>
              </div>
            </div>

            {/* How it works */}
            <Card className="mb-4">
              <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-3">How QC Works</h2>
              <div className="flex flex-col gap-3">
                {[
                  {
                    n: "1", title: "Professional Plan → Auto-routed to you",
                    desc: "Every chapter on Professional plan is automatically sent to you after the writer/analyst submits. Run AI and plagiarism checks, then send to student."
                  },
                  {
                    n: "2", title: "Student Corrections → You handle first",
                    desc: "When a student requests a correction, it comes directly to you. You see their original work and their request. Make the correction and send back — or escalate to the writer if needed."
                  },
                ].map((item) => (
                  <div key={item.n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 text-xs font-800 flex items-center justify-center flex-shrink-0">
                      {item.n}
                    </div>
                    <div>
                      <p className="text-sm font-700 text-navy-DEFAULT">{item.title}</p>
                      <p className="text-xs text-navy-muted mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Earnings snapshot */}
            <div
              onClick={() => router.push("/qc/earnings")}
              className="bg-navy-DEFAULT rounded-2xl p-4 text-white cursor-pointer hover:bg-navy-mid transition-all flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-sky-300 uppercase tracking-wider font-700 mb-0.5">Available Balance</p>
                <p className="font-clash text-2xl font-800">₦{counts.available.toLocaleString()}</p>
                <p className="text-xs text-sky-300 mt-1">Total earned: ₦{counts.totalEarned.toLocaleString()}</p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
}
