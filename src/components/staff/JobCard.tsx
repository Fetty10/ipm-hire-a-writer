"use client";
// src/components/staff/JobCard.tsx
// Renders a single job card — pending (with start/reject) or active (with upload/submit)

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FileUpload } from "./FileUpload";
import { Badge, StatusBadge, Button } from "@/components/ui";
import { ChapterStatus, DegreeGroup, PlanName } from "@prisma/client";
import { clsx } from "clsx";

const DEG_LABELS: Record<DegreeGroup, string> = {
  OND_HND_NCE: "HND/OND/NCE",
  BSC_BED_BA:  "BSc/BEd/BA",
  PGD_MSC_PHD: "PGD/MSc/PhD",
};

const PLAN_LABELS: Record<PlanName, string> = {
  BASIC:            "Basic",
  STANDARD:         "Standard",
  PROFESSIONAL:     "Professional",
  PHD_PROFESSIONAL: "PhD Professional",
};

interface WriterPrelimNotes {
  objectives: string | null;
  questions:  string | null;
  hypotheses: string | null;
  scope:      string | null;
}

export interface JobCardProps {
  id:              string;
  chapterLabel:    string;
  chapterNumber:   number;
  topic:           string;
  department:      string;
  degreeGroup:     DegreeGroup;
  planName:        PlanName;
  status:          ChapterStatus;
  requiresPrelim:  boolean;
  specialInstructions?: string | null;
  guidelineFileUrl?:    string | null;
  correctionNotes?:     string | null;
  writerPrelimNotes?:   WriterPrelimNotes | null;
  // Prelim field values (Chapter 1)
  researchObjectives?: string | null;
  researchQuestions?:  string | null;
  hypotheses?:         string | null;
  scopeOfStudy?:       string | null;
  qcStarted?:   boolean;
  onStarted?:   () => void;
  onRejected?:  () => void;
  onSubmitted?: () => void;
}

export function JobCard(props: JobCardProps) {
  const router  = useRouter();
  const isPending = props.status === ChapterStatus.NOT_STARTED;
  const isActive  = [ChapterStatus.IN_PROGRESS, ChapterStatus.PRELIM_SUBMITTED].includes(props.status);

  const [starting,   setStarting]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejecting,  setRejecting]  = useState(false);

  // Form state for active jobs
  const [fileUrl,    setFileUrl]    = useState<string>("");
  const [writerNotes, setWriterNotes] = useState("");
  // Prelim fields
  const [objectives, setObjectives] = useState(props.researchObjectives || "");
  const [questions,  setQuestions]  = useState(props.researchQuestions  || "");
  const [hypos,      setHypos]      = useState(props.hypotheses         || "");
  const [scope,      setScope]      = useState(props.scopeOfStudy       || "");

  const prelimComplete = !props.requiresPrelim || (objectives && questions && hypos && scope);
  const canSubmit      = fileUrl && prelimComplete;

  async function handleStart() {
    setStarting(true);
    try {
      const res  = await fetch("/api/chapters/start", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ chapterId: props.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Job started!");
      props.onStarted?.();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setStarting(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      const res  = await fetch("/api/chapters/reject", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ chapterId: props.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(data.message);
      props.onRejected?.();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setRejecting(false);
      setShowReject(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res  = await fetch("/api/chapters/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          chapterId: props.id,
          fileUrl,
          writerNotes: writerNotes || undefined,
          researchObjectives: objectives || undefined,
          researchQuestions:  questions  || undefined,
          hypotheses:         hypos      || undefined,
          scopeOfStudy:       scope      || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(
        data.routedToQC
          ? "Submitted and routed to QC for plagiarism/AI check."
          : "Submitted and delivered to student!"
      );
      props.onSubmitted?.();
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-sky-100 shadow-card p-5 transition-all hover:shadow-card-hover">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-700 text-navy-DEFAULT">{props.chapterLabel}</h3>
          <p className="text-xs text-navy-muted mt-1 line-clamp-2">{props.topic}</p>
          <p className="text-xs text-navy-muted">
            {props.department} · {DEG_LABELS[props.degreeGroup]}
          </p>
        </div>
        <StatusBadge status={props.status} qcStarted={props.qcStarted} />
      </div>

      {/* Student Instructions */}
      {props.specialInstructions && (
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 mb-4">
          <p className="text-xs font-700 text-sky-700 uppercase tracking-wider mb-1">Student Instructions</p>
          <p className="text-xs text-navy-DEFAULT leading-relaxed">{props.specialInstructions}</p>
        </div>
      )}

      {/* Correction notes (if sent back from QC) */}
      {props.correctionNotes && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
          <p className="text-xs font-700 text-orange-700 uppercase tracking-wider mb-1">⚠️ Correction Required</p>
          <p className="text-xs text-orange-900 leading-relaxed">{props.correctionNotes}</p>
        </div>
      )}

      {/* Writer prelim notes for analysts (Ch 3 & 4) */}
      {props.writerPrelimNotes && (
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 mb-4">
          <p className="text-xs font-700 text-sky-700 uppercase tracking-wider mb-1.5">Writer's Preliminary Notes</p>
          {props.writerPrelimNotes.objectives && (
            <p className="text-xs text-navy-DEFAULT mb-1"><strong>Objectives:</strong> {props.writerPrelimNotes.objectives}</p>
          )}
          {props.writerPrelimNotes.questions && (
            <p className="text-xs text-navy-DEFAULT mb-1"><strong>Questions:</strong> {props.writerPrelimNotes.questions}</p>
          )}
          {props.writerPrelimNotes.scope && (
            <p className="text-xs text-navy-DEFAULT"><strong>Scope:</strong> {props.writerPrelimNotes.scope}</p>
          )}
        </div>
      )}

      {/* Guideline download */}
      {props.guidelineFileUrl && (
        <div className="mb-4">
          {props.guidelineFileUrl.split(",").map(u => u.trim()).filter(Boolean).map((u, i, arr) => (
            <a
              key={i}
              href={`/api/download/guideline?url=${encodeURIComponent(u)}&label=${encodeURIComponent(`Guideline${arr.length>1?` ${i+1}`:""}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-600 text-sky-600 hover:underline mb-1 block"
            >
              📎 Download School Format/Guideline{arr.length>1?` ${i+1}`:""}
            </a>
          ))}
        </div>
      )}

      {/* ── PENDING ACTIONS ── */}
      {isPending && (
        <>
          {showReject ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
              <p className="text-sm font-700 text-red-800 mb-1">Are you sure?</p>
              <p className="text-xs text-red-700 mb-3">
                Rejecting this job will remove it from your list and reassign it to the next available staff member.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  loading={rejecting}
                  onClick={handleReject}
                >
                  Yes, Reject
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReject(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <Button variant="primary" size="sm" loading={starting} onClick={handleStart}>
                ▶ Start Job
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowReject(true)}>
                ✕ Reject Job
              </Button>
            </div>
          )}
        </>
      )}

      {/* ── ACTIVE: CHAPTER 1 PRELIM FIELDS ── */}
      {isActive && props.requiresPrelim && (
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-4">
          <p className="text-xs font-700 text-sky-700 uppercase tracking-wider mb-3">
            Required Before Uploading Chapter 1
          </p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Research Objectives", val: objectives, set: setObjectives, placeholder: "State the research objectives..." },
              { label: "Research Questions",  val: questions,  set: setQuestions,  placeholder: "List your research questions..." },
              { label: "Hypotheses",          val: hypos,      set: setHypos,      placeholder: "State your hypotheses..." },
              { label: "Scope of Study",      val: scope,      set: setScope,      placeholder: "Describe scope and limitations..." },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label}>
                <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wide block mb-1">
                  {label}
                </label>
                <textarea
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIVE: FILE UPLOAD ── */}
      {isActive && (
        <>
          <FileUpload
            folder="chapters/submitted"
            label={`Upload ${props.chapterLabel} File`}
            onUpload={(url) => setFileUrl(url)}
            disabled={props.requiresPrelim && !prelimComplete}
            className="mb-3"
          />

          {props.requiresPrelim && !prelimComplete && (
            <p className="text-xs text-orange-600 font-600 mb-3">
              🔒 Complete all 4 preliminary fields above to unlock the upload.
            </p>
          )}

          <div className="mb-4">
            <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wide block mb-1.5">
              Notes for Admin (optional)
            </label>
            <textarea
              value={writerNotes}
              onChange={(e) => setWriterNotes(e.target.value)}
              placeholder="Any notes about this chapter..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
            />
          </div>

          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
            className={clsx("w-full", !canSubmit && "opacity-40 cursor-not-allowed")}
          >
            Submit {props.chapterLabel} →
          </Button>
        </>
      )}
    </div>
  );
}
