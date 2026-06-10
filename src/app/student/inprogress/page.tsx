"use client";
// src/app/student/inprogress/page.tsx
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";
import { Spinner } from "@/components/ui";

interface Order { id:string; topic:string; degreeGroup:string; status:string; planName:string; totalChapters:number; deliveredChapters:number; chapters:{id:string;chapterLabel:string;chapterNumber:number;status:string;deliveredFileUrl:string|null}[]; }
const STEP_LABELS=["Paid","Assigned","Writing","QC","Done"];
const STATUS_STEPS:Record<string,number>={PENDING_PAYMENT:0,PAYMENT_CONFIRMED:1,IN_PROGRESS:2,QC_REVIEW:3,DELIVERED:4};

export default function StudentInProgress() {
  const [orders,setOrders]=useState<Order[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    fetch("/api/student/orders?filter=active").then(r=>r.json()).then(d=>{ if(d.success) setOrders(d.data); setLoading(false); });
  },[]);
  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Works in Progress</h1>
        <p className="text-sm text-navy-muted mb-5">Track each chapter of your active orders.</p>
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div>
        : orders.length===0 ? <div className="text-center py-16"><div className="text-4xl mb-3">⏳</div><p className="text-navy-muted font-600">No active orders.</p></div>
        : <div className="flex flex-col gap-4">{orders.map(order=>(
          <div key={order.id} className="bg-white rounded-2xl border border-sky-100 shadow-card p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-700 text-navy-DEFAULT">{order.topic}</h2>
                <p className="text-xs text-navy-muted mt-1">{order.planName} Plan · {order.deliveredChapters}/{order.totalChapters} chapters delivered</p>
              </div>
              <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 ${order.status==="QC_REVIEW"?"bg-sky-100 text-sky-700":"bg-yellow-50 text-yellow-700"}`}>
                {order.status==="IN_PROGRESS"?"In Progress":order.status==="QC_REVIEW"?"QC Review":"In Progress"}
              </span>
            </div>
            {/* Tracker */}
            <div className="flex items-center mb-4 relative">
              <div className="absolute left-0 right-0 top-[17px] h-0.5 bg-sky-100 z-0"/>
              {STEP_LABELS.map((label,i)=>{
                const curr=STATUS_STEPS[order.status]||0;
                const done=i<curr,active=i===curr;
                return <div key={label} className="flex-1 flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${done?"bg-sky-400 border-sky-400 text-white":active?"bg-white border-sky-400":""} `}>{done?"✓":i+1}</div>
                  <span className={`text-[.6rem] font-600 mt-1 text-center ${done?"text-sky-600":active?"text-navy-DEFAULT font-700":"text-navy-muted"}`}>{label}</span>
                </div>;
              })}
            </div>
            {/* Chapters */}
            <div className="flex flex-col gap-1.5">
              {order.chapters.map(ch=>(
                <div key={ch.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-sky-50/50 border border-sky-100">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-800 font-clash flex-shrink-0 ${ch.status==="DELIVERED"?"bg-sky-400 text-white":"bg-sky-100 text-sky-700"}`}>{ch.chapterNumber}</div>
                  <span className="flex-1 text-xs font-600 text-navy-DEFAULT truncate">{ch.chapterLabel}</span>
                  {ch.status==="DELIVERED"&&ch.deliveredFileUrl
                    ? <a href={ch.deliveredFileUrl} target="_blank" rel="noreferrer" className="text-xs font-600 text-sky-600 hover:underline flex-shrink-0">⬇ Download</a>
                    : <span className={`text-xs font-600 flex-shrink-0 ${ch.status==="IN_PROGRESS"?"text-yellow-600":ch.status==="QC_IN_PROGRESS"?"text-sky-600":"text-navy-muted"}`}>
                        {ch.status==="IN_PROGRESS"?"In Progress":ch.status==="QC_IN_PROGRESS"?"QC Review":ch.status==="NOT_STARTED"?"Queued":"–"}
                      </span>}
                </div>
              ))}
            </div>
          </div>
        ))}</div>}
      </div>
    </StudentLayout>
  );
}
