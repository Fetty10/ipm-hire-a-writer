"use client";
// src/app/qc/corrections/active/page.tsx

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Spinner, Button } from "@/components/ui";
import { FileUpload } from "@/components/staff/FileUpload";
import { QC_NAV } from "../../_nav";
import toast from "react-hot-toast";

interface CorrJob {
  id: string; chapterLabel: string; topic: string;
  department: string; degreeGroup: string;
  correctionNotes: string | null; submittedFileUrl: string | null;
  adminNotes: string | null;
}

const DEG: Record<string,string> = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};

export default function QCCorrectionsActive() {
  const { data: session } = useSession();
  const [jobs,    setJobs]    = useState<CorrJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobState, setJobState] = useState<Record<string, {
    fileUrl: string; notes: string; submitting: boolean;
    escalateOpen: boolean; escalateInstructions: string; escalateType: string; escalating: boolean;
  }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/qc/jobs?flow=corrections&status=active");
    const data = await res.json();
    if (data.success) {
      setJobs(data.data);
      const init: typeof jobState = {};
      data.data.forEach((j: CorrJob) => {
        init[j.id] = { fileUrl:"", notes:"", submitting:false, escalateOpen:false, escalateInstructions:"", escalateType:"corrections", escalating:false };
      });
      setJobState(init);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function upd(id: string, field: string, value: string | boolean) {
    setJobState(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleSendToStudent(jobId: string) {
    const state = jobState[jobId];
    if (!state?.fileUrl) { toast.error("Please upload the corrected file first."); return; }
    upd(jobId, "submitting", true);
    try {
      const res = await fetch("/api/chapters/qc-clear", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: jobId, clearedFileUrl: state.fileUrl,
          qcNotes: state.notes || undefined, isCorrection: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Correction sent to student!");
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch { toast.error("Something went wrong."); }
    finally { upd(jobId, "submitting", false); }
  }

  async function handleEscalate(jobId: string) {
    const state = jobState[jobId];
    if (!state.escalateInstructions.trim()) { toast.error("Please provide instructions for the writer."); return; }
    upd(jobId, "escalating", true);
    try {
      const res = await fetch("/api/chapters/qc-escalate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: jobId, escalationType: state.escalateType,
          instructionsForWriter: state.escalateInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch { toast.error("Something went wrong."); }
    finally { upd(jobId, "escalating", false); }
  }

  function getSupervisorUrl(adminNotes: string | null) {
    if (!adminNotes) return null;
    const m = adminNotes.match(/supervisor_notes:(.+)/);
    return m ? m[1] : null;
  }

  const initials = session?.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = QC_NAV.map(item => item.href==="/qc/corrections/active" ? {...item,badge:jobs.length} : item);

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Working on Corrections</h1>
        <p className="text-sm text-navy-muted mb-5">Make corrections and send back to student, or escalate to writer if needed.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✏️</div>
            <p className="text-navy-muted font-600">No corrections in progress.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {jobs.map((job) => {
              const state = jobState[job.id] || { fileUrl:"", notes:"", submitting:false, escalateOpen:false, escalateInstructions:"", escalateType:"corrections", escalating:false };
              const supervisorUrl = getSupervisorUrl(job.adminNotes);

              return (
                <Card key={job.id}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-700 text-navy-DEFAULT">{job.chapterLabel}</h3>
                      <p className="text-xs text-navy-muted mt-1">{job.topic}</p>
                      <p className="text-xs text-navy-muted">{job.department} · {DEG[job.degreeGroup]}</p>
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-700 bg-yellow-50 text-yellow-700">In Progress</span>
                  </div>

                  {/* Student request reminder */}
                  {job.correctionNotes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                      <p className="text-xs font-700 text-yellow-800 uppercase tracking-wider mb-1.5">Student's Request (for reference)</p>
                      <p className="text-sm text-yellow-900 leading-relaxed">{job.correctionNotes}</p>
                    </div>
                  )}

                  {/* Download files */}
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 mb-4">
                    <p className="text-xs font-700 text-sky-700 uppercase tracking-wider mb-2">Files to Work From</p>
                    <div className="flex flex-col gap-1.5">
                      {job.submittedFileUrl && (
                        <a href={job.submittedFileUrl} target="_blank" rel="noreferrer"
                          className="text-xs font-600 text-sky-600 hover:underline">
                          ⬇ {job.chapterLabel} — Original Delivered Version
                        </a>
                      )}
                      {supervisorUrl && (
                        <a href={supervisorUrl} target="_blank" rel="noreferrer"
                          className="text-xs font-600 text-sky-600 hover:underline">
                          ⬇ Supervisor's Notes (uploaded by student)
                        </a>
                      )}
                    </div>
                  </div>

                  {/* QC correction notes */}
                  <div className="mb-4">
                    <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
                      Your Correction Notes <span className="font-400 normal-case text-navy-muted">(visible to admin & student)</span>
                    </label>
                    <textarea rows={3}
                      placeholder="Describe what you corrected. e.g. Expanded section 2.2 with 2021–2024 Nigerian social media data. Updated all citations to APA 7th edition."
                      value={state.notes}
                      onChange={e => upd(job.id, "notes", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                    />
                  </div>

                  {/* Upload corrected file */}
                  <FileUpload
                    folder="chapters/corrections"
                    label={`Upload Corrected ${job.chapterLabel}`}
                    onUpload={(url) => upd(job.id, "fileUrl", url)}
                    className="mb-4"
                  />

                  {/* Send to student */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                    <p className="text-sm font-700 text-green-800 mb-1">✅ Send Corrected Work to Student</p>
                    <p className="text-xs text-green-700 mb-3">Upload the corrected file above then click to send it directly to the student.</p>
                    <Button
                      variant="primary"
                      loading={state.submitting}
                      onClick={() => handleSendToStudent(job.id)}
                      disabled={!state.fileUrl}
                      className={!state.fileUrl ? "opacity-40 cursor-not-allowed" : ""}
                    >
                      ✅ Send Correction to Student →
                    </Button>
                  </div>

                  {/* Escalate */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <button
                      onClick={() => upd(job.id, "escalateOpen", !state.escalateOpen)}
                      className="text-sm font-700 text-yellow-800 w-full text-left flex items-center justify-between"
                    >
                      🔧 Escalate to Writer
                      <span className="text-xs">{state.escalateOpen ? "▲" : "▼"}</span>
                    </button>
                    <p className="text-xs text-yellow-700 mt-1">
                      Use this if the correction requires the original writer to rewrite content. Both your instructions and the student's request will be visible to the writer.
                    </p>
                    {state.escalateOpen && (
                      <div className="mt-3 flex flex-col gap-3">
                        <div>
                          <label className="text-xs font-700 text-yellow-800 uppercase tracking-wider block mb-1.5">Type of Escalation</label>
                          <select
                            value={state.escalateType}
                            onChange={e => upd(job.id, "escalateType", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-yellow-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300"
                          >
                            <option value="corrections">Send back for specific corrections</option>
                            <option value="section_rewrite">Request full rewrite of section</option>
                            <option value="full_rewrite">Request complete chapter rewrite</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-700 text-yellow-800 uppercase tracking-wider block mb-1.5">Instructions for Writer</label>
                          <textarea rows={3}
                            placeholder="Be specific. e.g. Please rewrite section 2.2 to include Nigerian social media statistics (2021–2024). Fix all in-text citations to APA 7th edition."
                            value={state.escalateInstructions}
                            onChange={e => upd(job.id, "escalateInstructions", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-yellow-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
                          />
                        </div>
                        <Button variant="warning" loading={state.escalating} onClick={() => handleEscalate(job.id)}>
                          🔧 Send Back to Writer →
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
