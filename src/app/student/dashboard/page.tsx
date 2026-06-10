export const dynamic = "force-dynamic";
"use client";
// src/app/student/dashboard/page.tsx

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/student/StudentLayout";
import { Spinner } from "@/components/ui";

interface Order {
  id: string; topic: string; degreeGroup: string; status: string;
  planName: string; totalChapters: number; deliveredChapters: number;
  chapters: { id:string; chapterLabel:string; status:string; deliveredFileUrl:string|null }[];
}

const STATUS_STEPS: Record<string, number> = {
  PENDING_PAYMENT: 0, PAYMENT_CONFIRMED: 1, IN_PROGRESS: 2, QC_REVIEW: 3, DELIVERED: 4,
};

const STEP_LABELS = ["Paid", "Assigned", "Writing", "QC", "Done"];

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [downloads, setDownloads] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [ordersRes, dlRes] = await Promise.all([
        fetch("/api/student/orders"),
        fetch("/api/student/downloads"),
      ]);
      const ordersData = await ordersRes.json();
      const dlData     = await dlRes.json();
      if (ordersData.success) setOrders(ordersData.data);
      if (dlData.success)     setDownloads(dlData.data.length);
      setLoading(false);
    }
    load();
  }, []);

  const active    = orders.filter(o => ["IN_PROGRESS","QC_REVIEW","PAYMENT_CONFIRMED"].includes(o.status));
  const completed = orders.filter(o => o.status === "DELIVERED");
  const latestActive = active[0];

  return (
    <StudentLayout badges={{ "/student/inprogress": active.length, "/student/downloads": downloads }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">
          Hello, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-navy-muted mb-5">What would you like to do today?</p>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Quick action grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { icon:"✍️", label:"Hire a Writer",     sub:"Place a new order",        href:"/student/hire",        border:true  },
                { icon:"⏳", label:"Works in Progress", sub:`${active.length} active`,  href:"/student/inprogress",  border:false },
                { icon:"✅", label:"Completed Works",   sub:`${completed.length} done`, href:"/student/completed",   border:false },
                { icon:"⬇️", label:"Downloads",         sub:`${downloads} files ready`, href:"/student/downloads",   border:false },
              ].map(item => (
                <div key={item.href} onClick={() => router.push(item.href)}
                  className={`bg-white rounded-2xl border ${item.border ? "border-2 border-sky-400" : "border-sky-100"} shadow-card p-4 cursor-pointer hover:shadow-card-hover hover:border-sky-400 transition-all text-center`}>
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-clash text-sm font-700 text-navy-DEFAULT">{item.label}</div>
                  <div className="text-xs text-navy-muted mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>

            {/* Latest order tracker */}
            {latestActive && (
              <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-navy-muted uppercase tracking-wider font-700 mb-1">Latest Order</p>
                    <h2 className="text-sm font-700 text-navy-DEFAULT leading-tight">{latestActive.topic}</h2>
                    <p className="text-xs text-navy-muted mt-1">{latestActive.planName} Plan · {latestActive.deliveredChapters}/{latestActive.totalChapters} chapters delivered</p>
                  </div>
                  <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 ${
                    latestActive.status === "DELIVERED" ? "bg-green-50 text-green-700" :
                    latestActive.status === "QC_REVIEW" ? "bg-sky-100 text-sky-700" :
                    "bg-yellow-50 text-yellow-700"
                  }`}>
                    {latestActive.status === "IN_PROGRESS" ? "In Progress" : latestActive.status === "QC_REVIEW" ? "QC Review" : latestActive.status}
                  </span>
                </div>

                {/* Progress dots */}
                <div className="flex items-center mb-4 relative">
                  <div className="absolute left-0 right-0 top-[17px] h-0.5 bg-sky-100 z-0" />
                  {STEP_LABELS.map((label, i) => {
                    const current = STATUS_STEPS[latestActive.status] || 0;
                    const done    = i < current;
                    const active  = i === current;
                    return (
                      <div key={label} className="flex-1 flex flex-col items-center relative z-10">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-all ${
                          done   ? "bg-sky-400 border-sky-400 text-white" :
                          active ? "bg-white border-sky-400 shadow-glow" :
                          "bg-white border-sky-100 text-navy-muted"
                        }`}>
                          {done ? "✓" : i + 1}
                        </div>
                        <span className={`text-[.6rem] font-600 mt-1 text-center ${
                          done ? "text-sky-600" : active ? "text-navy-DEFAULT font-700" : "text-navy-muted"
                        }`}>{label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Chapter rows */}
                <div className="flex flex-col gap-1.5">
                  {latestActive.chapters.slice(0, 3).map(ch => (
                    <div key={ch.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-50/50 border border-sky-100">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-800 font-clash flex-shrink-0 ${
                        ch.status === "DELIVERED" ? "bg-sky-400 text-white" : "bg-sky-100 text-sky-700"
                      }`}>
                        {ch.chapterNumber}
                      </div>
                      <span className="flex-1 text-xs font-600 text-navy-DEFAULT truncate">{ch.chapterLabel}</span>
                      {ch.status === "DELIVERED" && ch.deliveredFileUrl ? (
                        <a href={ch.deliveredFileUrl} target="_blank" rel="noreferrer"
                          className="text-xs font-600 text-sky-600 hover:underline flex-shrink-0">⬇ Download</a>
                      ) : (
                        <span className={`text-xs font-600 flex-shrink-0 ${
                          ch.status === "IN_PROGRESS" ? "text-yellow-600" :
                          ch.status === "QC_IN_PROGRESS" ? "text-sky-600" : "text-navy-muted"
                        }`}>
                          {ch.status === "IN_PROGRESS" ? "In Progress" :
                           ch.status === "QC_IN_PROGRESS" ? "QC Review" :
                           ch.status === "NOT_STARTED" ? "Queued" : ch.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {latestActive.totalChapters > 3 && (
                  <button onClick={() => router.push("/student/inprogress")}
                    className="text-xs text-sky-600 font-600 mt-2 hover:underline w-full text-center">
                    View all {latestActive.totalChapters} chapters →
                  </button>
                )}
              </div>
            )}

            {!latestActive && orders.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">✍️</div>
                <p className="font-700 text-navy-DEFAULT mb-1">No orders yet</p>
                <p className="text-sm text-navy-muted mb-4">Get started by hiring a writer for your project.</p>
                <button onClick={() => router.push("/student/hire")}
                  className="inline-flex items-center gap-2 bg-sky-400 text-navy font-700 text-sm px-6 py-3 rounded-xl hover:bg-sky-500 transition-all">
                  ✍️ Hire a Writer →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
