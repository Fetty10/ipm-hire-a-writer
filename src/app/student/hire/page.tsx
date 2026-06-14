"use client";
// src/app/student/hire/page.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentLayout } from "@/components/student/StudentLayout";
import { FileUpload } from "@/components/staff/FileUpload";
import { Spinner } from "@/components/ui";
import toast from "react-hot-toast";

interface Plan { id:string; planName:string; degreeGroup:string; pricingType:string; priceKobo:number; priceGHS?:number|null; priceKES?:number|null; priceUSD?:number|null; priceGBP?:number|null; includesPlagiarismCheck:boolean; includesCorrections:boolean; includesFormat:boolean; }

const DEG_GROUPS = [
  { group:"Diploma / Certificate", options:[
    { value:"OND_HND_NCE", label:"HND | OND | NCE" },
  ]},
  { group:"Undergraduate", options:[
    { value:"BSC_BED_BA",  label:"BSc | BEd | BA | BTech | BEng | Nursing" },
  ]},
  { group:"Postgraduate", options:[
    { value:"PGD_MSC_PHD", label:"PGD | MSc | MBA | MBBS | LL.B" },
    { value:"PHD",         label:"PhD" },
  ]},
];

const PROJECT_SERVICE = { value:"project", label:"Project / Thesis / Dissertation / Term Paper", hasPlan:true };

// Map service values to valid ServiceType enum values
const SERVICE_TYPE_MAP: Record<string,string> = {
  project:         "HIRE_WRITER",
  seminar:         "PROPOSAL_SEMINAR",
  proposal:        "PROPOSAL_SEMINAR",
  journal:         "JOURNAL_WRITING",
  journal_sourcing:"JOURNAL_SOURCING",
  topic:           "TOPIC_SUGGESTION",
  assignment:      "HIRE_WRITER",
};
function toServiceType(svc: string): string {
  return SERVICE_TYPE_MAP[svc] || "HIRE_WRITER";
}

const CHAPTER_LABELS = ["Chapter 1","Chapter 2","Chapter 3","Chapter 4","Chapter 5"];
const PLAN_DISPLAY: Record<string,string> = {BASIC:"Basic",STANDARD:"Standard",PROFESSIONAL:"Professional",PHD_PROFESSIONAL:"PhD Professional"};

const PLAN_DESC: Record<string,string[]> = {
  BASIC:            [
    "One flat price for your COMPLETE project.",
    "Your supervisor's corrections will NOT be handled by us.",
    "Your Format/Guideline will NOT be used.",
  ],
  STANDARD:         [
    "You pay for EACH chapter separately.",
    "Your supervisor's corrections will be handled by us.",
    "Your Format/Guideline will be used.",
  ],
  PROFESSIONAL:     [
    "You pay for EACH chapter separately.",
    "Plagiarism will be checked.",
    "Your supervisor's corrections will be handled by us.",
    "Your Format/Guideline will be used.",
  ],
  PHD_PROFESSIONAL: [
    "You pay for EACH chapter separately.",
    "Plagiarism will be checked.",
    "Your supervisor's corrections will be handled by us.",
    "Your Format/Guideline will be used.",
    "Tailored to doctoral/PhD writing standards.",
  ],
};

export default function HireAWriter() {
  const router = useRouter();
  const [plans,      setPlans]      = useState<Plan[]>([]);
  const [otherSvcs,  setOtherSvcs]  = useState<any[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [bankAccount,  setBankAccount]  = useState<any>(null);
  const [quantity,     setQuantity]     = useState<number>(1);
  const [areaOfInterest, setAreaOfInterest] = useState("");
  const [geoInfo,      setGeoInfo]      = useState<{currency:string;symbol:string;flw:string;isNigeria:boolean}>({currency:"NGN",symbol:"₦",flw:"NGN",isNigeria:true});
  const [showBankModal,setShowBankModal]= useState(false);
  const [bankPending,  setBankPending]  = useState(false);
  const [bankDone,     setBankDone]     = useState<any>(null); // {reference, amountNaira}

  // Build full services list: project first, then dynamic others
  const SERVICES = [
    PROJECT_SERVICE,
    ...otherSvcs.map(s => ({ ...s, hasPlan: false })),
  ];

  // Form state
  const [degreeGroup,  setDegreeGroup]  = useState("");
  const [service,      setService]      = useState("");
  const [planId,       setPlanId]       = useState("");
  const [selChapters,  setSelChapters]  = useState<number[]>([]);
  const [topic,        setTopic]        = useState("");
  const [department,   setDepartment]   = useState("");
  const [instructions, setInstructions] = useState("");
  const [guidelineUrls, setGuidelineUrls] = useState<{url:string,name:string}[]>([]);
  const [uploadingGuide, setUploadingGuide] = useState(false);
  const [errors,       setErrors]       = useState<Record<string,string>>({});

  // Fetch other services, bank account and detect country on mount
  useEffect(() => {
    fetch("/api/admin/other-services")
      .then(r => r.json())
      .then(d => { if (d.success) setOtherSvcs(d.data); });
    fetch("/api/orders/bank-transfer")
      .then(r => r.json())
      .then(d => { if (d.success) setBankAccount(d.data); });
    fetch("/api/detect-country")
      .then(r => r.json())
      .then(d => { setGeoInfo({ currency: d.currency, symbol: d.symbol, flw: d.flw, isNigeria: d.isNigeria }); });
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
  function calcUnitPrice(): number {
    if (!isProject) {
      const svc = SERVICES.find(s => s.value === service) as any;
      if (!svc || !degreeGroup) return 0;
      if (!geoInfo.isNigeria) {
        const degKey: Record<string,string> = { OND_HND_NCE:"OND", BSC_BED_BA:"BSC", PGD_MSC_PHD:"PGD", PHD:"PHD" };
        const field = `price${geoInfo.currency}${degKey[degreeGroup]||"BSC"}`;
        const intlPrice = svc[field] || 0;
        if (intlPrice > 0) return intlPrice / 100;
      }
      const priceMap: Record<string,number> = {
        OND_HND_NCE: svc.priceOND || 0, BSC_BED_BA: svc.priceBSC || 0,
        PGD_MSC_PHD: svc.pricePGD || 0, PHD: svc.pricePHD || svc.pricePGD || 0,
      };
      return (priceMap[degreeGroup] || 0) / 100;
    }
    return 0;
  }

  function calcTotal(): number {
    if (!degreeGroup) return 0;
    if (!isProject) {
      const svc = SERVICES.find(s => s.value === service) as any;
      if (!svc || !degreeGroup) return 0;
      const degKey: Record<string,string> = { OND_HND_NCE:"OND", BSC_BED_BA:"BSC", PGD_MSC_PHD:"PGD", PHD:"PHD" };
      let unitPrice = 0;
      if (!geoInfo.isNigeria) {
        const field = `price${geoInfo.currency}${degKey[degreeGroup]||"BSC"}`;
        unitPrice = (svc[field] || 0) / 100;
      }
      if (!unitPrice) {
        const priceMap: Record<string,number> = {
          OND_HND_NCE: svc.priceOND || 0,
          BSC_BED_BA:  svc.priceBSC || 0,
          PGD_MSC_PHD: svc.pricePGD || 0,
          PHD:         svc.pricePHD || svc.pricePGD || 0,
        };
        unitPrice = (priceMap[degreeGroup] || 0) / 100;
      }
      const qty = (service === "topic" || service === "journal_sourcing") ? quantity : 1;
      return unitPrice * qty;
    }
    if (!selectedPlan) return 0;
    // Use international price if available
    const intlPriceField = `price${geoInfo.currency}` as keyof Plan;
    const intlUnitPrice  = (!geoInfo.isNigeria && selectedPlan[intlPriceField])
      ? (selectedPlan[intlPriceField] as number) / 100
      : selectedPlan.priceKobo / 100;
    if (!isPerChapter) return intlUnitPrice;
    return intlUnitPrice * selChapters.length;
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
    if (!topic.trim() && service !== "topic" && service !== "journal_sourcing") e.topic = "Please enter your project topic.";
    if (!department.trim() && service !== "topic") e.department = "Please enter your department.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleFlutterwave() {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        planId:            isProject ? planId : "flat",
        topic:             service === "topic" ? `Topic Coining — ${department.trim()}` : topic.trim(),
        department:        department.trim(),
        degreeGroup,
        specialInstructions: service === "topic"
          ? `Course: ${department.trim()}. Area of Interest: ${areaOfInterest.trim()}.${instructions.trim() ? " " + instructions.trim() : ""}`
          : instructions.trim() || undefined,
        quantity:    (service === "topic" || service === "journal_sourcing") ? quantity : undefined,
        guidelineFileUrl:  guidelineUrls.length > 0 ? guidelineUrls.map((f:any)=>f.url).join(",") : undefined,
        chaptersRequested: isProject && isPerChapter ? selChapters : undefined,
        serviceType:       toServiceType(service),
        currency:          geoInfo.currency,
        amount:            total,
      };
      const res  = await fetch("/api/payments/flutterwave", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Payment initialization failed."); return; }
      // Redirect to Flutterwave payment page
      window.location.href = data.paymentLink;
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  }

  async function handleBankTransfer() {
    if (!validate()) return;
    // Just show the modal with bank details — order is created only after student confirms transfer
    setShowBankModal(true);
  }

  async function handleConfirmTransfer() {
    setBankPending(true);
    try {
      const payload = {
        planId:            isProject ? planId : "flat",
        topic:             service === "topic" ? `Topic Coining — ${department.trim()}` : topic.trim(),
        department:        department.trim(),
        degreeGroup,
        specialInstructions: service === "topic"
          ? `Course: ${department.trim()}. Area of Interest: ${areaOfInterest.trim()}.${instructions.trim() ? " " + instructions.trim() : ""}`
          : instructions.trim() || undefined,
        quantity:    (service === "topic" || service === "journal_sourcing") ? quantity : undefined,
        guidelineFileUrl:  guidelineUrls.length > 0 ? guidelineUrls.map(f=>f.url).join(",") : undefined,
        chaptersRequested: isProject && isPerChapter ? selChapters : undefined,
        serviceType:       toServiceType(service),
      };
      const res  = await fetch("/api/orders/bank-transfer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      setBankDone({ reference: data.reference, amountNaira: data.amountNaira });
    } catch { toast.error("Something went wrong. Please try again."); }
    finally { setBankPending(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // If non-project service, use a fixed plan ID or handle differently
      const payload = {
        planId:            isProject ? planId : "flat",
        topic:             service === "topic" ? `Topic Coining — ${department.trim()}` : topic.trim(),
        department:        department.trim(),
        degreeGroup,
        specialInstructions: service === "topic"
          ? `Course: ${department.trim()}. Area of Interest: ${areaOfInterest.trim()}.${instructions.trim() ? " " + instructions.trim() : ""}`
          : instructions.trim() || undefined,
        quantity:    (service === "topic" || service === "journal_sourcing") ? quantity : undefined,
        guidelineFileUrl:  guidelineUrls.length > 0 ? guidelineUrls.map(f=>f.url).join(",") : undefined,
        chaptersRequested: isProject && isPerChapter ? selChapters : undefined,
        serviceType:       toServiceType(service),
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

  function getExpectedDelivery(): string {
    const d = new Date();
    let added = 0;
    while (added < 3) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    return d.toLocaleDateString("en-NG", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  }

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
              <option value="">Select level</option>
              {DEG_GROUPS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </optgroup>
              ))}
            </select>
            {errors.degreeGroup && <p className="text-xs text-red-500 mt-1">{errors.degreeGroup}</p>}
          </div>

          {/* Service Type */}
          <div>
            <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">What Do You Need?</label>
            <select value={service} onChange={e => { setService(e.target.value); setPlanId(""); setSelChapters([]); setQuantity(1); setAreaOfInterest(""); }}
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
                          — {geoInfo.symbol}{((!geoInfo.isNigeria && p[`price${geoInfo.currency}`]) ? p[`price${geoInfo.currency}`]/100 : p.priceKobo/100).toLocaleString()} {p.pricingType==="PER_CHAPTER" ? "per chapter" : "(complete project)"}
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                        planId === p.id ? "border-sky-400 bg-sky-400" : "border-sky-200"
                      }`} />
                    </div>
                    {PLAN_DESC[p.planName] && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {(PLAN_DESC[p.planName] as string[]).map((line, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-navy-muted leading-relaxed">
                            <span className="mt-0.5 text-sky-400 flex-shrink-0">▸</span>
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {p.includesCorrections && <span className="text-[.65rem] font-600 text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">Corrections ✓</span>}
                      {p.includesPlagiarismCheck && <span className="text-[.65rem] font-600 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">Plagiarism Check ✓</span>}
                      {p.includesFormat && <span className="text-[.65rem] font-600 text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Format ✓</span>}
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

          {/* Topic — hidden for topic coining */}
          {service !== "topic" && service !== "journal_sourcing" && (
            <div>
              <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Your Topic</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Impact of Digital Marketing on Consumer Behaviour in Nigeria"
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
              {errors.topic && <p className="text-xs text-red-500 mt-1">{errors.topic}</p>}
            </div>
          )}

          {/* Department — hidden for topic coining and journal (each has its own) */}
          {service !== "topic" && service !== "journal_sourcing" && (
            <div>
              <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Department / Course</label>
              <input value={department} onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. Business Administration"
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
            </div>
          )}

          {/* Special Instructions — hidden for topic coining and journal (each has its own) */}
          {service !== "topic" && service !== "journal_sourcing" && (
            <div>
              <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
                Special Instructions <span className="font-400 normal-case text-navy-muted">(optional)</span>
              </label>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={3}
                placeholder="e.g. Use APA 7th edition. Minimum 15 pages for each chapter. Focus on Nigerian context."
                className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
            </div>
          )}

          {/* Topic Coining — special fields */}
          {service === "topic" && (
            <div className="flex flex-col gap-4 p-4 bg-sky-50 rounded-xl border border-sky-200">
              <div className="text-xs font-700 text-sky-700 uppercase tracking-wider">Topic Coining Details</div>
              <div>
                <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Course of Study</label>
                <input value={department} onChange={e=>setDepartment(e.target.value)} placeholder="e.g. Mass Communication"
                  className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </div>
              <div>
                <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Area of Interest</label>
                <input value={areaOfInterest} onChange={e=>setAreaOfInterest(e.target.value)} placeholder="e.g. Social Media, Public Relations"
                  className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </div>
              <div>
                <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Number of Topics Needed</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={()=>setQuantity(q=>Math.max(1,q-1))}
                    className="w-10 h-10 rounded-xl border border-sky-200 text-lg font-700 text-sky-600 bg-white hover:bg-sky-50">−</button>
                  <span className="text-xl font-800 text-navy-DEFAULT w-10 text-center">{quantity}</span>
                  <button type="button" onClick={()=>setQuantity(q=>Math.min(20,q+1))}
                    className="w-10 h-10 rounded-xl border border-sky-200 text-lg font-700 text-sky-600 bg-white hover:bg-sky-50">+</button>
                  <span className="text-xs text-navy-muted ml-2">{geoInfo.symbol}{calcUnitPrice().toLocaleString()} per topic</span>
                </div>
              </div>
            </div>
          )}

          {/* Journal Sourcing — special fields */}
          {service === "journal_sourcing" && (
            <div className="flex flex-col gap-4 p-4 bg-sky-50 rounded-xl border border-sky-200">
              <div className="text-xs font-700 text-sky-700 uppercase tracking-wider">Journal Sourcing Details</div>
              <div>
                <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Research Topic / Keywords</label>
                <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Impact of social media on youth"
                  className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
              </div>
              <div>
                <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
                  Special Instructions <span className="font-400 normal-case text-navy-muted">(optional)</span>
                </label>
                <textarea value={instructions} onChange={e=>setInstructions(e.target.value)} rows={3}
                  placeholder="e.g. Peer-reviewed only, published after 2015"
                  className="w-full px-4 py-3 rounded-xl border border-sky-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
              </div>
              <div>
                <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">Number of Journals Needed</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={()=>setQuantity(q=>Math.max(1,q-1))}
                    className="w-10 h-10 rounded-xl border border-sky-200 text-lg font-700 text-sky-600 bg-white hover:bg-sky-50">−</button>
                  <span className="text-xl font-800 text-navy-DEFAULT w-10 text-center">{quantity}</span>
                  <button type="button" onClick={()=>setQuantity(q=>Math.min(50,q+1))}
                    className="w-10 h-10 rounded-xl border border-sky-200 text-lg font-700 text-sky-600 bg-white hover:bg-sky-50">+</button>
                  <span className="text-xs text-navy-muted ml-2">{geoInfo.symbol}{calcUnitPrice().toLocaleString()} per journal</span>
                </div>
              </div>
            </div>
          )}

          {/* Guideline upload */}
          <div>
            <label className="text-xs font-700 text-navy-DEFAULT uppercase tracking-wider block mb-1.5">
              Upload School Format/Guideline <span className="font-400 normal-case text-navy-muted">(optional)</span>
            </label>
            {/* Multi-file guideline upload — up to 5 files */}
            <div className="flex flex-col gap-2">
              {guidelineUrls.map((f,i) => (
                <div key={i} className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-sm">
                  <span className="text-sky-500">📎</span>
                  <span className="flex-1 text-navy-DEFAULT font-600 truncate">{f.name}</span>
                  <button type="button" className="text-red-400 hover:text-red-600 text-xs font-700"
                    onClick={()=>setGuidelineUrls(prev=>prev.filter((_,j)=>j!==i))}>✕</button>
                </div>
              ))}
              {guidelineUrls.length < 5 && (
                <div
                  onClick={()=>{
                    if(uploadingGuide) return;
                    const inp=document.createElement("input");
                    inp.type="file"; inp.accept=".pdf,.doc,.docx";
                    inp.onchange=async(e)=>{
                      const file=(e.target as HTMLInputElement).files?.[0];
                      if(!file) return;
                      if(file.size>20*1024*1024){toast.error("Max 20MB per file");return;}
                      setUploadingGuide(true);
                      const fd=new FormData(); fd.append("file",file); fd.append("folder","orders/guidelines");
                      const res=await fetch("/api/upload",{method:"POST",body:fd});
                      const data=await res.json();
                      if(res.ok) setGuidelineUrls(prev=>[...prev,{url:data.url,name:file.name}]);
                      else toast.error(data.error||"Upload failed");
                      setUploadingGuide(false);
                    };
                    inp.click();
                  }}
                  className="border-2 border-dashed border-sky-200 rounded-xl p-4 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-all">
                  {uploadingGuide
                    ? <p className="text-sm text-navy-muted">Uploading...</p>
                    : <><p className="text-sm font-600 text-navy-DEFAULT">📎 {guidelineUrls.length===0?"Upload Format/Guideline":"Add Another File"}</p>
                       <p className="text-xs text-navy-muted mt-1">PDF or Word · Max 20MB · Up to 5 files</p></>}
                </div>
              )}
              {guidelineUrls.length > 0 && (
                <p className="text-xs text-sky-600 font-600">{guidelineUrls.length} file{guidelineUrls.length>1?"s":""} selected</p>
              )}
            </div>
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
                  <span className="font-clash text-lg font-800 text-sky-600">{geoInfo.symbol}{total.toLocaleString()}</span>
                </div>
                {showSummary && (
                  <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-[.62rem] font-700 uppercase tracking-wider text-green-700 mb-0.5">📅 Expected Delivery</div>
                    <div className="text-sm font-700 text-green-800">{getExpectedDelivery()}</div>
                    <div className="text-[.7rem] text-green-600 mt-0.5">3 working days from tomorrow (weekdays only)</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pay with Paystack (Nigeria) or Flutterwave (International) */}
          {geoInfo.isNigeria ? (
            <button type="submit" disabled={loading || !showSummary}
              className={`w-full py-4 rounded-xl font-700 text-sm transition-all flex items-center justify-center gap-2 ${
                showSummary && !loading ? "bg-sky-400 text-navy-DEFAULT hover:bg-sky-500" : "bg-sky-100 text-navy-muted cursor-not-allowed"
              }`}>
              {loading ? <><Spinner size="sm" /> Processing...</> : `💳 Pay ₦${total.toLocaleString()} with Paystack →`}
            </button>
          ) : (
            <button type="button" disabled={loading || !showSummary}
              onClick={handleFlutterwave}
              className={`w-full py-4 rounded-xl font-700 text-sm transition-all flex items-center justify-center gap-2 ${
                showSummary && !loading ? "bg-sky-400 text-navy-DEFAULT hover:bg-sky-500" : "bg-sky-100 text-navy-muted cursor-not-allowed"
              }`}>
              {loading ? <><Spinner size="sm" /> Processing...</> : `💳 Pay ${geoInfo.symbol}${total.toLocaleString()} →`}
            </button>
          )}

          {/* Divider + Bank Transfer — Nigeria only */}
          {geoInfo.isNigeria && <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-sky-100"/>
            <span className="text-xs text-navy-muted font-600">OR</span>
            <div className="flex-1 h-px bg-sky-100"/>
          </div>

          <button type="button" disabled={bankPending || !showSummary}
            onClick={handleBankTransfer}
            className={`w-full py-4 rounded-xl font-700 text-sm border-2 transition-all flex items-center justify-center gap-2 ${
              showSummary && !bankPending
                ? "border-sky-400 text-sky-600 hover:bg-sky-50"
                : "border-sky-100 text-navy-muted cursor-not-allowed"
            }`}>
            {bankPending ? <><Spinner size="sm" /> Please wait...</> : `🏦 Pay ₦${total.toLocaleString()} via Bank Transfer`}
          </button>

          <p className="text-xs text-navy-muted text-center">🔒 Secure payment · Pay online or via bank transfer</p>

          </>}

        {/* Bank Transfer Modal */}
          {showBankModal && bankAccount && (
            <div className="fixed inset-0 bg-navy-DEFAULT/60 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🏦</div>
                  <h3 className="font-clash text-lg font-800 text-navy-DEFAULT">Transfer Payment Details</h3>
                  <p className="text-xs text-navy-muted mt-1">Transfer the exact amount and use the reference below</p>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-4 flex flex-col gap-2">
                  {[
                    { label:"Bank",           val: bankAccount.bankName },
                    { label:"Account Name",   val: bankAccount.accountName },
                    { label:"Account Number", val: bankAccount.accountNumber },
                    { label:"Amount",         val: `₦${total.toLocaleString()}` },
                    { label:"Reference",      val: bankDone?.reference || "Will be generated after you confirm" },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-sm">
                      <span className="text-navy-muted">{r.label}</span>
                      <span className="font-700 text-navy-DEFAULT">{r.val}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800 leading-relaxed">
                  ⚠️ <strong>Important:</strong> Transfer the exact amount shown above to the account details. Click <strong>"I Have Made the Transfer"</strong> after sending the money. Your order will be activated within 30 minutes during business hours.
                </div>

                {!bankDone ? (
                  <>
                    <button
                      disabled={bankPending}
                      onClick={handleConfirmTransfer}
                      className="w-full py-3 rounded-xl bg-sky-400 text-navy-DEFAULT font-700 text-sm flex items-center justify-center gap-2">
                      {bankPending ? <><Spinner size="sm" /> Processing...</> : "I Have Made the Transfer →"}
                    </button>
                    <button
                      onClick={() => setShowBankModal(false)}
                      className="w-full py-2 mt-2 text-xs text-navy-muted">
                      Go Back
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-sm text-green-800 text-center font-600">
                      ✅ Order submitted! We'll confirm your payment within 30 minutes.
                    </div>
                    <button
                      onClick={() => { setShowBankModal(false); window.location.href = "/student/dashboard"; }}
                      className="w-full py-3 rounded-xl bg-sky-400 text-navy-DEFAULT font-700 text-sm">
                      Go to Dashboard →
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </StudentLayout>
  );
}
