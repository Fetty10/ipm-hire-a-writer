"use client";
// src/app/qc/checks/active/page.tsx

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, Spinner, Button } from "@/components/ui";
import { FileUpload } from "@/components/staff/FileUpload";
import { QC_NAV } from "../../_nav";
import toast from "react-hot-toast";

interface QCJob {
  id: string; chapterLabel: string; chapterNumber: number;
  topic: string; department: string; degreeGroup: string; planName: string;
  requiresPlagiarism: boolean; requiresAI: boolean;
  submittedFileUrl: string | null; specialInstructions: string | null;
}

export default function QCChecksActive() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs,    setJobs]    = useState<QCJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-job state
  const [jobState, setJobState] = useState<Record<string, {
    fileUrl: string; plagScore: string; aiScore: string; notes: string; submitting: boolean;
  }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/qc/jobs?flow=checks&status=active");
    const data = await res.json();
    if (data.success) {
      setJobs(data.data);
      const init: typeof jobState = {};
      data.data.forEach((j: QCJob) => {
        init[j.id] = { fileUrl: "", plagScore: "", aiScore: "", notes: "", submitting: false };
      });
      setJobState(init);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateJob(id: string, field: string, value: string) {
    setJobState(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function handleClear(jobId: string) {
    const state = jobState[jobId];
    if (!state?.fileUrl) { toast.error("Please upload the cleared file first."); return; }

    setJobState(prev => ({ ...prev, [jobId]: { ...prev[jobId], submitting: true } }));
    try {
      const res = await fetch("/api/chapters/qc-clear", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId:       jobId,
          clearedFileUrl:  state.fileUrl,
          plagiarismScore: state.plagScore ? parseFloat(state.plagScore) : undefined,
          aiScore:         state.aiScore   ? parseFloat(state.aiScore)   : undefined,
          qcNotes:         state.notes     || undefined,
          isCorrection:    false,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Chapter cleared and sent to student!");
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch { toast.error("Something went wrong."); }
    finally {
      setJobState(prev => ({ ...prev, [jobId]: { ...prev[jobId], submitting: false } }));
    }
  }

  async function handleEscalate(jobId: string, instructions: string, type: string) {
    if (!instructions.trim()) { toast.error("Please provide instructions for the writer."); return; }
    const res = await fetch("/api/chapters/qc-escalate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterId: jobId, escalationType: type, instructionsForWriter: instructions }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success(data.message);
    setJobs(prev => prev.filter(j => j.id !== jobId));
  }

  const DEG: Record<string,string> = {OND_HND_NCE:"HND/OND/NCE",BSC_BED_BA:"BSc/BEd/BA",PGD_MSC_PHD:"PGD/MSc/PhD"};
  const initials = session?.user?.name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()||"QC";
  const nav = QC_NAV.map(item => item.href==="/qc/checks/active" ? {...item,badge:jobs.length} : item);

  return (
    <StaffLayout navItems={nav} role="Quality Control" initials={initials}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Active Checks</h1>
        <p className="text-sm text-navy-muted mb-5">Run your checks then upload the cleared version.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-navy-muted font-600">No active checks.</p>
            <p className="text-sm text-navy-muted mt-1">Start a check from Pending Checks to see it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {jobs.map((job) => {
              const state = jobState[job.id] || { fileUrl:"", plagScore:"", aiScore:"", notes:"", submitting:false };
              const [escalateOpen, setEscalateOpen] = useState(false);
              const [escalateInstructions, setEscalateInstructions] = useState("");
              const [escalateType, setEscalateType] = useState("corrections");

              return (
                <Card key={job.id}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-700 text-navy-DEFAULT">{job.chapterLabel}</h3>
                      <p className="text-xs text-navy-muted mt-1">{job.topic}</p>
                      <p className="text-xs text-navy-muted">{job.department} · {DEG[job.degreeGroup]} · Professional</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {job.requiresPlagiarism && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[.65rem] font-700 bg-red-50 text-red-700">Plagiarism</span>}
                      {job.requiresAI && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[.65rem] font-700 bg-purple-50 text-purple-700">AI Check</span>}
                    </div>
                  </div>

                  {/* Download original */}
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 mb-4">
                    <p className="text-xs font-700 text-sky-700 uppercase tracking-wider mb-2">Original Submitted File</p>
                    {job.submittedFileUrl ? (
                      <a href={job.submittedFileUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-600 text-sky-600 hover:underline">
                        ⬇ Download {job.chapterLabel} (Writer's Version)
                      </a>
                    ) : (
                      <p className="text-xs text-navy-muted">No file available.</p>
                    )}
                  </div>

                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
                        Plagiarism Score (%)
                      </label>
                      <input
                        type="number" min="0" max="100" placeholder="e.g. 8"
                        value={state.plagScore}
                        onChange={e => updateJob(job.id, "plagScore", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
                        AI Content Score (%)
                      </label>
                      <input
                        type="number" min="0" max="100" placeholder="e.g. 12"
                        value={state.aiScore}
                        onChange={e => updateJob(job.id, "aiScore", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                      />
                    </div>
                  </div>

                  {/* QC Notes */}
                  <div className="mb-4">
                    <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
                      QC Notes <span className="font-400 text-navy-muted normal-case">(admin only)</span>
                    </label>
                    <textarea
                      rows={3} placeholder="e.g. Plagiarism: 8%, AI: 12%. Edited sections 2.3 and 2.5. Chapter cleared."
                      value={state.notes}
                      onChange={e => updateJob(job.id, "notes", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                    />
                  </div>

                  {/* Upload cleared version */}
                  <FileUpload
                    folder="chapters/qc-cleared"
                    label={`Upload Cleared Version of ${job.chapterLabel}`}
                    onUpload={(url) => updateJob(job.id, "fileUrl", url)}
                    className="mb-4"
                  />

                  {/* Send to student */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
                    <p className="text-sm font-700 text-green-800 mb-1">✅ Clear & Send to Student</p>
                    <p className="text-xs text-green-700 mb-3">
                      Upload the cleared file above then click below to deliver it to the student.
                    </p>
                    <Button
                      variant="primary"
                      loading={state.submitting}
                      onClick={() => handleClear(job.id)}
                      disabled={!state.fileUrl}
                      className={!state.fileUrl ? "opacity-40 cursor-not-allowed" : ""}
                    >
                      ✅ Clear & Send to Student →
                    </Button>
                  </div>

                  {/* Escalate to writer */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <button
                      onClick={() => setEscalateOpen(!escalateOpen)}
                      className="text-sm font-700 text-yellow-800 w-full text-left flex items-center justify-between"
                    >
                      🔧 Chapter needs correction — send back to writer
                      <span className="text-xs">{escalateOpen ? "▲" : "▼"}</span>
                    </button>
                    {escalateOpen && (
                      <div className="mt-3 flex flex-col gap-3">
                        <div>
                          <label className="text-xs font-700 text-yellow-800 uppercase tracking-wider block mb-1.5">
                            Type of Escalation
                          </label>
                          <select
                            value={escalateType}
                            onChange={e => setEscalateType(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-yellow-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                          >
                            <option value="corrections">Specific corrections</option>
                            <option value="section_rewrite">Section rewrite</option>
                            <option value="full_rewrite">Full chapter rewrite</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-700 text-yellow-800 uppercase tracking-wider block mb-1.5">
                            Instructions for Writer
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Describe exactly what needs to be corrected or rewritten..."
                            value={escalateInstructions}
                            onChange={e => setEscalateInstructions(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-yellow-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none bg-white"
                          />
                        </div>
                        <Button
                          variant="warning"
                          onClick={() => handleEscalate(job.id, escalateInstructions, escalateType)}
                        >
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
