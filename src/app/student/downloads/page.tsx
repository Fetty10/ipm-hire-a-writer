"use client";
// src/app/student/downloads/page.tsx
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";
import { Spinner } from "@/components/ui";

interface Download { id:string; chapterLabel:string; chapterNumber:number; topic:string; degreeGroup:string; planName:string; fileUrl:string|null; deliveredAt:string|null; isQcCleared:boolean; }
const DEG:Record<string,string>={OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};

export default function StudentDownloads() {
  const [downloads,setDownloads]=useState<Download[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ fetch("/api/student/downloads").then(r=>r.json()).then(d=>{ if(d.success) setDownloads(d.data); setLoading(false); }); },[]);
  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Downloads</h1>
        <p className="text-sm text-navy-muted mb-5">All your delivered chapters ready to download.</p>
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div>
        : downloads.length===0 ? <div className="text-center py-16"><div className="text-4xl mb-3">📭</div><p className="text-navy-muted font-600">No files ready yet.</p><p className="text-sm text-navy-muted mt-1">Delivered chapters will appear here.</p></div>
        : <>
          <div className="flex flex-col gap-3">
            {downloads.map(d=>(
              <div key={d.id} className="bg-white rounded-2xl border border-sky-100 shadow-card p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-700 text-navy-DEFAULT">{d.chapterLabel}</p>
                  <p className="text-xs text-navy-muted truncate">{d.topic}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-navy-muted">{DEG[d.degreeGroup]}</span>
                    {d.isQcCleared && <span className="text-xs font-700 text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">QC Cleared ✓</span>}
                    {d.deliveredAt && <span className="text-xs text-navy-muted">{new Date(d.deliveredAt).toLocaleDateString("en-NG")}</span>}
                  </div>
                </div>
                {d.fileUrl ? (
                  <a href={d.fileUrl} target="_blank" rel="noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-400 text-navy-DEFAULT text-xs font-700 hover:bg-sky-500 transition-all">
                    ⬇ Download
                  </a>
                ) : (
                  <span className="text-xs text-navy-muted flex-shrink-0">Not available</span>
                )}
              </div>
            ))}
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 mt-4 text-xs text-sky-800">
            ℹ Files are available for 90 days after delivery. Make sure to save copies to your device or Google Drive.
          </div>
        </>}
      </div>
    </StudentLayout>
  );
}
