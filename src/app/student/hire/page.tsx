"use client";
// src/app/student/hire/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/student/StudentLayout";
import { FileUpload } from "@/components/staff/FileUpload";
import { Spinner } from "@/components/ui";
import toast from "react-hot-toast";

interface Plan { id:string; planName:string; degreeGroup:string; pricingType:string; priceKobo:number; includesPlagiarismCheck:boolean; includesCorrections:boolean; }

const DEG_GROUPS = [
  { value:"OND_HND_NCE", label:"HND | OND | NCE" },
  { value:"BSC_BED_BA",  label:"BSc | BEd | BA | BTech | BEng | Nursing" },
  { value:"PGD_MSC_PHD", label:"PGD | MSc | MBA | MBBS | LL.B | PhD" },
];

const PROJECT_SERVICE = { value:"project", label:"Project / Thesis / Dissertation / Term Paper", hasPlan:true };

const CHAPTER_LABELS = ["Chapter 1","Chapter 2","Chapter 3","Chapter 4","Chapter 5"];
const PLAN_DISPLAY: Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Professional"};

export default function HireAWriter() {
  const router = useRouter();
  const [plans,      setPlans]      = useState<Plan[]>([]);
  const [otherSvcs,  setOtherSvcs]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);

  // Build full services list: project first, then dynamic others
  const SERVICES = [
    PROJECT_SERVICE,
    ...otherSvcs.map(s => ({ value: s.value, label: s.label, hasPlan: false, priceOND: s.priceOND, priceBSC: s.priceBSC, pricePGD: s.pricePGD })),
  ];

  // Form state
  const [degreeGroup,  setDegreeGroup]  = useState("");
  const [service,      setService]      = useState("");
  const [planId,       setPlanId]       = useState("");
  const [selChapters,  setSelChapters]  = useState<number[]>([]);
  const [topic,        setTopic]        = useState("");
  const [department,   setDepartment]   = useState("");
  const [instructions, setInstructions] = useState("");
  const [guidelineUrl, setGuidelineUrl] = useState("");
  const [errors,       setErrors]       = useState<Record<string,string>>({});

  // Fetch other services on mount
  useEffect(() => {
    fetch("/api/admin/other-services")
      .then(r => r.json())
      .then(d => { if (d.success) setOtherSvcs(d.data); });
  }, []);

  // Fetch plans when degree group changes
  useEffect(() => {
    if (!degreeGroup) { setPlans([]); return; }
    fetch(`/api/plans?degreeGroup=${degreeGroup}`)
      .then(r => r.json())
      .then(d => { if (d.success) setPlans(d.data); });
  }, [degreeGroup]);

  const selectedService = SERVICES.find(s => s.value === service);
  const selectedPlan    = plans.find(p => p.id === planId);
  const isPerChapter    = selectedPlan?.pricingType === "PER_CHAPTER";
  const isProject       = service === "project";

  // Calculate total
  function calcTotal(): number {
    if (!degreeGroup) return 0;
    if (!isProject) {
      const svc = SERVICES.find(s => s.value === service) as any;
      if (!svc || !degreeGroup) return 0;
      const priceMap: Record<string,number> = {
        OND_HND_NCE: svc.priceOND || 0,
        BSC_BED_BA:  svc.priceBSC || 0,
        PGD_MSC_PHD: svc.pricePGD || 0,
      };
      return (priceMap[degreeGroup] || 0) / 100;
    }
    if (!selectedPlan) return 0;
    if (!isPerChapter) return selectedPlan.priceKobo / 100;
    return (selectedPlan.priceKobo / 100) * selChapters.length;
  }

  function toggleChapter(n: number) {
    setSelChapters(prev =>
      prev.includes(n) ? prev.filter(c => c !== n) : [...prev, n]
    );
  }

  function validate() {
    const e: Record<string,string> = {};
    if (!degreeGroup)          e.degreeGroup = "Please select your academic level.";
    if (!service)              e.service     = "Please select a service type.";
    if (isProject && !planId)  e.planId      = "Please choose a plan.";
    if (isProject && isPerChapter && selChapters.length === 0)
                               e.chapters    = "Please select at least one chapter.";
    if (!topic.trim())         e.topic       = "Please enter your project topic.";
    if (!department.trim() && service !== "topic") e.department = "Please enter your department.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // If non-project service, use a fixed plan ID or handle differently
      const payload = {
        planId:            isProject ? planId : "flat",
        topic:             topic.trim(),
        department:        department.trim(),
        degreeGroup,
        specialInstructions: instructions.trim() || undefined,
        guidelineFileUrl:  guidelineUrl || undefined,
        chaptersRequested: isProject && isPerChapter ? selChapters : undefined,
        serviceType:       service.toUpperCase(),
      };

      const res  = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }

      // Redirect to Paystack
      window.location.href = data.paymentUrl;
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  const total  = calcTotal();
  const showSummary = degreeGroup && service && (isProject ? planId && (!isPerChapter || selChapters.length > 0) : true);

  return (
    <StudentLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="font-clash text-2xl font-800 text-navy-DEFAULT tracking-tight mb-1">Hire a Writer</h1>
        <p className="text-sm text-navy-muted mb-5">Fill in the form and we'll assign the right expert to your work.</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-sky-100 shadow-card p-5 flex flex-col gap-4">

          {/* Academic Level */}
          <div>
            <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Academic Level</label>
            <select value={degreeGroup} onChange={e => { setDegreeGroup(e.target.value); setPlanId(""); setSelChapters([]); }}
              className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
              <option value="">-- Select your level --</option>
              {DEG_GROUPS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            {errors.degreeGroup && <p className="text-xs text-red-500 mt-1">{errors.degreeGroup}</p>}
          </div>

          {/* Service Type */}
          <div>
            <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">What Do You Need?</label>
            <select value={service} onChange={e => { setService(e.target.value); setPlanId(""); setSelChapters([]); }}
              className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400">
              <option value="">-- Select service type --</option>
              {SERVICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {errors.service && <p className="text-xs text-red-500 mt-1">{errors.service}</p>}
          </div>

          {/* Plan — only for Project */}
          {isProject && degreeGroup && (
            <div>
              <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Choose a Plan</label>
              <div className="flex flex-col gap-2">
                {plans.map(p => (
                  <div key={p.id} onClick={() => { setPlanId(p.id); setSelChapters([]); }}
                    className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${
                      planId === p.id ? "border-sky-400 bg-sky-50" : "border-sky-100 hover:border-sky-300"
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-700 text-navy-DEFAULT">{PLAN_DISPLAY[p.planName]}</span>
                        <span className="text-sm text-navy-muted ml-2">
                          — ₦{(p.priceKobo/100).toLocaleString()} {p.pricingType==="PER_CHAPTER" ? "per chapter" : "(complete project)"}
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                        planId === p.id ? "border-sky-400 bg-sky-400" : "border-sky-200"
                      }`} />
                    </div>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {p.includesCorrections && <span className="text-[.65rem] font-600 text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">Corrections ✓</span>}
                      {p.includesPlagiarismCheck && <span className="text-[.65rem] font-600 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Plagiarism Check ✓</span>}
                    </div>
                  </div>
                ))}
              </div>
              {errors.planId && <p className="text-xs text-red-500 mt-1">{errors.planId}</p>}
            </div>
          )}

          {/* Chapter selector — per-chapter plans only */}
          {isProject && isPerChapter && planId && (
            <div>
              <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
                Which Chapters? <span className="font-400 normal-case text-navy-muted">(select all you need)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {CHAPTER_LABELS.map((label, i) => {
                  const n = i + 1;
                  const sel = selChapters.includes(n);
                  return (
                    <button type="button" key={n} onClick={() => toggleChapter(n)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-600 transition-all ${
                        sel ? "border-sky-400 bg-sky-100 text-navy-DEFAULT" : "border-sky-100 text-navy-muted hover:border-sky-300"
                      }`}>
                      {label}
                    </button>
                  );
                })}
              </div>
              {selChapters.length > 0 && (
                <p className="text-xs text-sky-600 font-600 mt-1.5">{selChapters.length} chapter{selChapters.length>1?"s":""} selected</p>
              )}
              {errors.chapters && <p className="text-xs text-red-500 mt-1">{errors.chapters}</p>}
            </div>
          )}

          {/* Topic */}
          <div>
            <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Your Topic</label>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Impact of Digital Marketing on Consumer Behaviour in Nigeria"
              className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            {errors.topic && <p className="text-xs text-red-500 mt-1">{errors.topic}</p>}
          </div>

          {/* Department */}
          {service !== "topic" && (
            <div>
              <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Department / Course</label>
              <input value={department} onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Business Administration"
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
              Special Instructions <span className="font-400 normal-case text-navy-muted">(optional)</span>
            </label>
            <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={3}
              placeholder="e.g. Use APA 7th edition. Minimum 15 pages for each chapter. Focus on Nigerian context."
              className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
          </div>

          {/* Guideline upload */}
          <div>
            <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
              Upload School Format/Guideline <span className="font-400 normal-case text-navy-muted">(optional)</span>
            </label>
            <FileUpload
              folder="orders/guidelines"
              label="Tap to upload your format guide"
              onUpload={(url) => setGuidelineUrl(url)}
            />
          </div>

          {/* Payment Summary */}
          {showSummary && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <p className="text-xs font-700 text-sky-700 uppercase tracking-wider mb-3">Order Summary</p>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between"><span className="text-navy-muted">Service</span><span className="font-600">{selectedService?.label || service}</span></div>
                {isProject && selectedPlan && (
                  <div className="flex justify-between"><span className="text-navy-muted">Plan</span><span className="font-600">{PLAN_DISPLAY[selectedPlan.planName]}</span></div>
                )}
                {isProject && isPerChapter && selChapters.length > 0 && (
                  <div className="flex justify-between"><span className="text-navy-muted">Chapters</span><span className="font-600">{selChapters.sort().map(n=>`Ch ${n}`).join(", ")} ({selChapters.length})</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-sky-200 mt-1">
                  <span className="font-700">Total</span>
                  <span className="font-clash text-lg font-800 text-sky-600">₦{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || !showSummary}
            className={`w-full py-4 rounded-xl font-700 text-sm transition-all flex items-center justify-center gap-2 ${
              showSummary && !loading
                ? "bg-sky-400 text-navy-DEFAULT hover:bg-sky-500"
                : "bg-sky-100 text-navy-muted cursor-not-allowed"
            }`}>
            {loading ? <><Spinner size="sm" /> Processing...</> : `💳 Pay ₦${total.toLocaleString()} with Paystack →`}
          </button>

          <p className="text-xs text-navy-muted text-center">🔒 Secure payment powered by Paystack</p>
        </form>
      </div>
    </StudentLayout>
  );
}
