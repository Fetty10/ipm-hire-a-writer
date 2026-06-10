"use client";
// src/app/writer/earnings/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Spinner, Button } from "@/components/ui";

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

const PLAN_LABELS: Record<string, string> = {
  BASIC: "Basic", STANDARD: "Standard",
  PROFESSIONAL: "Professional", PHD_PROFESSIONAL: "PhD Professional",
};

const DEG_LABELS: Record<string, string> = {
  OND_HND_NCE: "HND/OND/NCE", BSC_BED_BA: "BSc/BEd/BA", PGD_MSC_PHD: "PGD/MSc/PhD",
};

interface EarningItem {
  id: string; amountNaira: number; status: string;
  createdAt: string; availableAt: string | null;
  topic: string; chapterLabel: string; degreeGroup: string; planName: string;
}

interface Summary {
  available: number; pending: number; totalEarned: number; withdrawn: number;
}

export default function WriterEarnings() {
  const { data: session } = useSession();
  const router = useRouter();
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      const res  = await fetch("/api/staff/earnings");
      const data = await res.json();
      if (data.success) {
        setEarnings(data.data.earnings);
        setSummary(data.data.summary);
      }
      setLoading(false);
    }
    load();
  }, []);

  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "WR";

  return (
    <StaffLayout navItems={WRITER_NAV} role="Writer" initials={initials}>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Earnings</h1>
        <p className="text-sm text-navy-muted mb-5">Your per-job earnings breakdown.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Available",    val: summary?.available    || 0, color: "text-sky-600"   },
                { label: "Pending",      val: summary?.pending      || 0, color: "text-yellow-600"},
                { label: "Total Earned", val: summary?.totalEarned  || 0, color: "text-navy-DEFAULT"},
                { label: "Withdrawn",    val: summary?.withdrawn    || 0, color: "text-green-600" },
              ].map((s) => (
                <Card key={s.label} className="text-center">
                  <p className={`font-clash text-xl font-800 ${s.color}`}>
                    ₦{s.val.toLocaleString()}
                  </p>
                  <p className="text-xs text-navy-muted mt-1">{s.label}</p>
                </Card>
              ))}
            </div>

            {/* Withdraw CTA */}
            {(summary?.available || 0) > 0 && (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-700 text-navy-DEFAULT">
                    ₦{(summary?.available || 0).toLocaleString()} available to withdraw
                  </p>
                  <p className="text-xs text-navy-muted mt-0.5">
                    Admin approval required — Paystack auto-transfers once approved.
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => router.push("/writer/withdraw")}>
                  Withdraw →
                </Button>
              </div>
            )}

            {/* Earnings table */}
            <Card>
              <h2 className="font-clash text-sm font-700 text-navy-DEFAULT mb-4">Earnings Per Job</h2>
              {earnings.length === 0 ? (
                <p className="text-xs text-navy-muted text-center py-6">No earnings yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-sky-100">
                        {["Topic", "Service Type", "Chapter", "My Earning", "Status"].map((h) => (
                          <th key={h} className="text-left py-2 px-3 text-[.6rem] font-700 uppercase tracking-wider text-navy-muted">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.map((e) => (
                        <tr key={e.id} className="border-b border-sky-50 hover:bg-sky-50/50">
                          <td className="py-2.5 px-3 max-w-[140px] truncate font-500">{e.topic}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {PLAN_LABELS[e.planName] || e.planName} · {DEG_LABELS[e.degreeGroup] || e.degreeGroup}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{e.chapterLabel}</td>
                          <td className="py-2.5 px-3 font-700 text-sky-600 whitespace-nowrap">
                            ₦{e.amountNaira.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[.65rem] font-700 ${
                              e.status === "AVAILABLE"  ? "bg-green-50 text-green-700"  :
                              e.status === "PENDING"    ? "bg-yellow-50 text-yellow-700" :
                              "bg-gray-100 text-gray-500"
                            }`}>
                              {e.status === "AVAILABLE" ? "Available" : e.status === "PENDING" ? "Pending" : "Withdrawn"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </StaffLayout>
  );
}
