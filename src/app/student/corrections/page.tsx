"use client";
// src/app/student/corrections/page.tsx
import { useEffect, useState } from "react";
import { StudentLayout } from "@/components/student/StudentLayout";
import { FileUpload } from "@/components/staff/FileUpload";
import { Spinner } from "@/components/ui";
import toast from "react-hot-toast";

interface Chapter { id:string; chapterLabel:string; }
interface Order   { id:string; topic:string; planName:string; chapters:Chapter[]; }

export default function StudentCorrections() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success,  setSuccess]  = useState(false);

  const [orderId,     setOrderId]     = useState("");
  const [chapterId,   setChapterId]   = useState("");
  const [request,     setRequest]     = useState("");
  const [supervisorUrl, setSupervisorUrl] = useState("");

  useEffect(()=>{ fetch("/api/student/orders?filter=completed").then(r=>r.json()).then(d=>{ if(d.success) setOrders(d.data); setLoading(false); }); },[]);

  const selectedOrder = orders.find(o => o.id === orderId);
  const includesCorrections = selectedOrder?.planName !== "BASIC";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chapterId)    { toast.error("Please select a chapter."); return; }
    if (!request.trim()){ toast.error("Please describe what needs to be corrected."); return; }
    setSubmitting(true);
    try {
      const res  = await fetch("/api/chapters/corrections", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ chapterId, correctionRequest:request, supervisorNotesUrl:supervisorUrl||undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Correction request submitted!");
      setSuccess(true);
    } catch { toast.error("Something went wrong."); }
    finally { setSubmitting(false); }
  }

  return (
    <StudentLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Request a Correction</h1>
        <p className="text-sm text-navy-muted mb-5">Not satisfied with a chapter? Let us know and we'll fix it.</p>

        {loading ? <div className="flex justify-center py-12"><Spinner size="lg"/></div>
        : success ? (
          <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-6 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="font-clash text-lg font-800 text-navy-DEFAULT mb-2">Correction Submitted!</h2>
            <p className="text-sm text-navy-muted">Our QC team will review your request and send back the corrected chapter. You'll be notified once it's ready.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-sky-100 shadow-card p-5 flex flex-col gap-4">

            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-800">
              ℹ Corrections are <strong>free</strong> on Standard and Professional plans. Your request goes to our QC team who will handle it directly.
            </div>

            {/* Order selector */}
            <div>
              <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Which Order?</label>
              <select value={orderId} onChange={e=>{setOrderId(e.target.value);setChapterId("");}}
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
                <option value="">-- Select an order --</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.topic} ({o.planName})</option>)}
              </select>
            </div>

            {/* Plan warning */}
            {orderId && !includesCorrections && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                ⚠ Your order is on the <strong>Basic plan</strong> which does not include free corrections. A correction fee will apply.
              </div>
            )}

            {/* Chapter selector */}
            {selectedOrder && (
              <div>
                <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Which Chapter?</label>
                <select value={chapterId} onChange={e=>setChapterId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
                  <option value="">-- Select a chapter --</option>
                  {selectedOrder.chapters.map(ch=><option key={ch.id} value={ch.id}>{ch.chapterLabel}</option>)}
                </select>
              </div>
            )}

            {/* Correction request */}
            <div>
              <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">What Needs to Be Corrected?</label>
              <textarea value={request} onChange={e=>setRequest(e.target.value)} rows={4}
                placeholder="Be specific. e.g. The introduction doesn't mention Nigeria. Please add the Nigerian context in section 1.2. Also, all references should be in APA 7th edition format."
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
            </div>

            {/* Supervisor notes upload */}
            <div>
              <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
                Upload Supervisor's Notes <span className="font-400 normal-case text-navy-muted">(optional)</span>
              </label>
              <FileUpload
                folder="orders/supervisor-notes"
                label="Upload supervisor's comments"
                onUpload={(url)=>setSupervisorUrl(url)}
              />
            </div>

            <button type="submit" disabled={submitting||!chapterId||!request.trim()}
              className={`w-full py-4 rounded-xl font-700 text-sm transition-all flex items-center justify-center gap-2 ${
                !submitting&&chapterId&&request.trim() ? "bg-sky-400 text-navy-DEFAULT hover:bg-sky-500" : "bg-sky-100 text-navy-muted cursor-not-allowed"
              }`}>
              {submitting ? "Submitting..." : "Submit Correction Request →"}
            </button>
          </form>
        )}
      </div>
    </StudentLayout>
  );
}
