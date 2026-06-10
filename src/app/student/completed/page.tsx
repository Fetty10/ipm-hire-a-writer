"use client";
// src/app/student/completed/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/student/StudentLayout";
import { Spinner } from "@/components/ui";

interface Order { id:string; topic:string; degreeGroup:string; planName:string; createdAt:string; chapters:{id:string;chapterLabel:string;deliveredFileUrl:string|null}[]; }
const DEG:Record<string,string>={OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};

export default function StudentCompleted() {
  const router=useRouter();
  const [orders,setOrders]=useState<Order[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ fetch("/api/student/orders?filter=completed").then(r=>r.json()).then(d=>{ if(d.success) setOrders(d.data); setLoading(false); }); },[]);
  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Completed Works</h1>
        <p className="text-sm text-navy-muted mb-5">All your fully delivered projects.</p>
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div>
        : orders.length===0 ? <div className="text-center py-16"><div className="text-4xl mb-3">✅</div><p className="text-navy-muted font-600">No completed orders yet.</p></div>
        : <div className="flex flex-col gap-4">{orders.map(order=>(
          <div key={order.id} className="bg-white rounded-2xl border border-sky-100 shadow-card p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-700 text-navy-DEFAULT">{order.topic}</h2>
                <p className="text-xs text-navy-muted mt-1">{DEG[order.degreeGroup]} · {order.planName} · {new Date(order.createdAt).toLocaleDateString("en-NG")}</p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-green-50 text-green-700">Done ✓</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={()=>router.push("/student/downloads")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-400 text-navy-DEFAULT text-xs font-700 hover:bg-sky-500 transition-all">
                ⬇ Download All Chapters
              </button>
              <button onClick={()=>router.push("/student/corrections")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-sky-400 text-sky-700 text-xs font-700 hover:bg-sky-50 transition-all">
                🔧 Request Correction
              </button>
            </div>
          </div>
        ))}</div>}
      </div>
    </StudentLayout>
  );
}
