"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicNav } from "@/components/PublicNav";

interface GeoInfo { currency:string; symbol:string; isNigeria:boolean; }
interface Plan {
  id:string; planName:string; priceKobo:number; pricingType:string; degreeGroup:string;
  includesPlagiarismCheck:boolean;
  priceUSD?:number|null; priceGBP?:number|null; priceGHS?:number|null; priceKES?:number|null;
}
interface OtherService {
  id:string; label:string; value:string; isActive:boolean;
  priceOND:number; priceBSC:number; pricePGD:number; pricePHD:number;
  [key:string]: any; // for priceUSDOND, priceGBSOND etc.
}

const PLAN_META: Record<string,{ tag:string; desc:string; features:string[]; notIncluded:string[]; border:string; badge:string|null; badgeBg:string; dark:boolean; }> = {
  BASIC:            { tag:"Full project, one price",    desc:"One flat payment covers your entire project (Chapters 1–5). Best if you want everything done at once.", features:["All 5 chapters included","Writer + Analyst assigned"], notIncluded:["Corrections","Guideline usage"], border:"#BAE6FD", badge:null, badgeBg:"", dark:false },
  STANDARD:         { tag:"Pay per chapter",            desc:"Pay for only the chapters you need. Supervisor corrections handled. Your school format applied.", features:["Pay per chapter","Writer + Analyst assigned","Supervisor corrections handled","School guideline applied"], notIncluded:["Plagiarism check"], border:"#38BDF8", badge:"Most Popular", badgeBg:"#38BDF8", dark:false },
  PROFESSIONAL:     { tag:"Pay per chapter + QC",       desc:"Everything in Standard, plus plagiarism and AI detection check before delivery.", features:["Pay per chapter","Writer + Analyst assigned","Supervisor corrections handled","School guideline applied","Plagiarism & AI check included"], notIncluded:[], border:"#818CF8", badge:"Best Value", badgeBg:"#818CF8", dark:false },
  PHD_PROFESSIONAL: { tag:"Doctoral standard",          desc:"Tailored specifically for PhD writing with doctoral-level rigour and plagiarism check.", features:["Per chapter","Specialist PhD writer assigned","Supervisor corrections handled","School guideline applied","Plagiarism & AI check included"], notIncluded:[], border:"#0C1A2E", badge:"PhD Only", badgeBg:"#475569", dark:true },
};

const DEG_GROUPS = [
  { key:"OND_HND_NCE", label:"HND / OND / NCE", short:"OND" },
  { key:"BSC_BED_BA",  label:"BSc / BEd / BA",  short:"BSC" },
  { key:"PGD_MSC_PHD", label:"PGD / MSc / MBA",  short:"PGD" },
  { key:"PHD",         label:"PhD",              short:"PHD" },
];

export default function PricingPage() {
  const router = useRouter();
  const [geo,      setGeo]      = useState<GeoInfo>({ currency:"NGN", symbol:"₦", isNigeria:true });
  const [plans,    setPlans]    = useState<Plan[]>([]);
  const [services, setServices] = useState<OtherService[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/detect-country").then(r=>r.json()),
      fetch("/api/plans").then(r=>r.json()),
      fetch("/api/other-services/public").then(r=>r.json()),
    ]).then(([g, p, sv]) => {
      if (g) setGeo({ currency:g.currency||"NGN", symbol:g.symbol||"₦", isNigeria:g.isNigeria!==false });
      if (p.success)  setPlans(p.data);
      if (sv.success) setServices(sv.data);
      setLoading(false);
    });
  }, []);

  // Get price for a plan in the user's currency
  function getPlanPrice(plan: Plan): number | null {
    if (geo.isNigeria) return plan.priceKobo / 100;
    const key = `price${geo.currency}` as keyof Plan;
    const val = plan[key] as number | null;
    return val ? val / 100 : null;
  }

  // Get price for an other service in the user's currency + degree
  function getSvcPrice(svc: OtherService, degShort: string): number | null {
    if (geo.isNigeria) {
      const key = `price${degShort === "OND" ? "OND" : degShort === "BSC" ? "BSC" : degShort === "PGD" ? "PGD" : "PHD"}`;
      return svc[key] / 100;
    }
    const key = `price${geo.currency}${degShort}`;
    const val = svc[key];
    return val ? val / 100 : null;
  }

  function fmt(amount: number | null): string {
    if (amount === null) return "Contact us";
    return `${geo.symbol}${amount.toLocaleString()}`;
  }

  // For the degree table — find plan by name + degree group
  function getPlanForDeg(planName: string, degKey: string): Plan | undefined {
    return plans.find(p => p.planName === planName && p.degreeGroup === degKey);
  }

  function fmtPlanDeg(planName: string, degKey: string): string {
    if (planName === "PHD_PROFESSIONAL" && degKey !== "PHD") return "—";
    if (planName !== "PHD_PROFESSIONAL" && degKey === "PHD") return "—";
    const plan = getPlanForDeg(planName, degKey);
    if (!plan) return "—";
    const price = getPlanPrice(plan);
    if (!price) return "Contact us";
    return `${fmt(price)}${plan.pricingType === "PER_CHAPTER" ? "/ch" : " (flat)"}`;
  }

  const uniquePlanNames = ["BASIC","STANDARD","PROFESSIONAL","PHD_PROFESSIONAL"];
  // Use OND_HND_NCE plan as the representative for card display price
  const planCards = uniquePlanNames.map(name => {
    const rep = plans.find(p => p.planName === name && p.degreeGroup === "OND_HND_NCE")
             || plans.find(p => p.planName === name && p.degreeGroup === "PHD")
             || plans.find(p => p.planName === name);
    return rep ? { ...rep, meta: PLAN_META[name] } : null;
  }).filter(Boolean) as (Plan & { meta: typeof PLAN_META[string] })[];

  return (
    <div style={{ minHeight:"100vh", background:"#F0F9FF", fontFamily:"'DM Sans',sans-serif" }}>
      <PublicNav />

      <div style={{ maxWidth:"900px", margin:"0 auto", padding:"3rem 1.5rem" }}>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:"3rem" }}>
          <div style={{ display:"inline-block", background:"#DBEAFE", color:"#1D4ED8", fontSize:".72rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", padding:".3rem .85rem", borderRadius:"999px", marginBottom:"1rem" }}>
            Transparent Pricing
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, color:"#0C1A2E", marginBottom:".75rem", lineHeight:1.2 }}>
            Know exactly what you pay.<br/>No surprises.
          </h1>
          <p style={{ fontSize:".92rem", color:"#5B7EA6", maxWidth:"500px", margin:"0 auto", lineHeight:1.7 }}>
            {geo.isNigeria
              ? "All prices in Nigerian Naira (₦). Pay via card or bank transfer."
              : `Prices shown in ${geo.currency}. You'll pay in your local currency at checkout.`}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"4rem", color:"#5B7EA6" }}>Loading prices...</div>
        ) : (
          <>
            {/* Plan cards */}
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1.25rem" }}>
              📚 Project / Thesis / Dissertation Plans
            </h2>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"1rem", marginBottom:"3rem" }}>
              {planCards.map(p => {
                const price = getPlanPrice(p);
                return (
                  <div key={p.planName} style={{ background:p.meta.dark?"#0C1A2E":"#fff", border:`2px solid ${p.meta.border}`, borderRadius:"16px", padding:"1.5rem", display:"flex", flexDirection:"column", position:"relative" }}>
                    {p.meta.badge && (
                      <div style={{ position:"absolute", top:"-12px", left:"50%", transform:"translateX(-50%)", background:p.meta.badgeBg, color:"#0C1A2E", fontSize:".65rem", fontWeight:700, padding:".2rem .75rem", borderRadius:"999px", whiteSpace:"nowrap" }}>
                        {p.meta.badge}
                      </div>
                    )}
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.05rem", fontWeight:800, color:p.meta.dark?"#fff":"#0C1A2E", marginBottom:".2rem" }}>
                      {p.planName.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                    </div>
                    <div style={{ fontSize:".72rem", color:p.meta.dark?"#94A3B8":"#5B7EA6", marginBottom:".5rem" }}>{p.meta.tag}</div>
                    {price !== null && (
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:p.meta.dark?"#38BDF8":"#0C1A2E", marginBottom:".25rem" }}>
                        {fmt(price)}{p.pricingType==="PER_CHAPTER" ? <span style={{fontSize:".7rem",fontWeight:400,color:p.meta.dark?"#94A3B8":"#5B7EA6"}}>/chapter</span> : <span style={{fontSize:".7rem",fontWeight:400,color:p.meta.dark?"#94A3B8":"#5B7EA6"}}> flat</span>}
                      </div>
                    )}
                    <div style={{ fontSize:".8rem", color:p.meta.dark?"#CBD5E1":"#5B7EA6", lineHeight:1.6, marginBottom:"1.25rem", flex:1 }}>{p.meta.desc}</div>
                    <ul style={{ listStyle:"none", padding:0, margin:"0 0 1.25rem", display:"flex", flexDirection:"column", gap:".4rem" }}>
                      {p.meta.features.map((f,i) => (
                        <li key={i} style={{ fontSize:".75rem", color:p.meta.dark?"#E2E8F0":"#0C1A2E", display:"flex", gap:".5rem" }}>
                          <span style={{color:"#22C55E",flexShrink:0}}>✓</span>{f}
                        </li>
                      ))}
                      {p.meta.notIncluded.map((f,i) => (
                        <li key={i} style={{ fontSize:".75rem", color:"#94A3B8", display:"flex", gap:".5rem", textDecoration:"line-through" }}>
                          <span style={{flexShrink:0}}>✕</span>{f}
                        </li>
                      ))}
                    </ul>
                    <button onClick={()=>router.push(`/register?plan=${p.planName}`)}
                      style={{ padding:".7rem", borderRadius:"10px", border:"none", cursor:"pointer", fontWeight:700, fontSize:".82rem", fontFamily:"'DM Sans',sans-serif",
                        background: p.meta.dark?"#38BDF8": p.planName==="PROFESSIONAL"?"#818CF8":"#0C1A2E",
                        color: p.meta.dark?"#0C1A2E":"#fff" }}>
                      Get Started →
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Degree level price table */}
            <div style={{ background:"#fff", border:"1.5px solid #E0F2FE", borderRadius:"16px", padding:"1.5rem", marginBottom:"3rem" }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:".95rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1rem" }}>
                📊 Price by Academic Level
              </h3>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".82rem" }}>
                  <thead>
                    <tr style={{ background:"#F0F9FF" }}>
                      <th style={{ padding:".6rem .75rem", textAlign:"left", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>Plan</th>
                      {DEG_GROUPS.map(d => (
                        <th key={d.key} style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uniquePlanNames.map((planName,i) => (
                      <tr key={planName} style={{ borderBottom:"1px solid #F0F9FF", background:i%2===0?"#fff":"#FAFCFF" }}>
                        <td style={{ padding:".65rem .75rem", fontWeight:700, color:"#0C1A2E" }}>
                          {planName.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                        </td>
                        {DEG_GROUPS.map(d => (
                          <td key={d.key} style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>
                            {fmtPlanDeg(planName, d.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize:".72rem", color:"#5B7EA6", marginTop:".75rem" }}>
                * "/ch" = per chapter. Basic plan covers all 5 chapters at one flat price.
                {!geo.isNigeria && ` Prices in ${geo.currency}.`}
              </p>
            </div>

            {/* Other Services */}
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1.25rem" }}>
              ⚡ Other Services
            </h2>
            <div style={{ background:"#fff", border:"1.5px solid #E0F2FE", borderRadius:"16px", padding:"1.5rem", marginBottom:"3rem" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".82rem" }}>
                  <thead>
                    <tr style={{ background:"#F0F9FF" }}>
                      <th style={{ padding:".6rem .75rem", textAlign:"left", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>Service</th>
                      {DEG_GROUPS.map(d => (
                        <th key={d.key} style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((sv,i) => (
                      <tr key={sv.id} style={{ borderBottom:"1px solid #F0F9FF", background:i%2===0?"#fff":"#FAFCFF" }}>
                        <td style={{ padding:".65rem .75rem", fontWeight:700, color:"#0C1A2E" }}>{sv.label}</td>
                        {DEG_GROUPS.map(d => (
                          <td key={d.key} style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>
                            {fmt(getSvcPrice(sv, d.short))}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!geo.isNigeria && (
                <p style={{ fontSize:".72rem", color:"#5B7EA6", marginTop:".75rem" }}>
                  * Prices in {geo.currency}. You'll pay in your local currency at checkout.
                </p>
              )}
            </div>

            {/* CTA */}
            <div style={{ background:"#0C1A2E", borderRadius:"20px", padding:"2.5rem", textAlign:"center" }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:"#fff", marginBottom:".75rem" }}>
                Ready to get started?
              </h2>
              <p style={{ color:"#94A3B8", fontSize:".88rem", marginBottom:"1.5rem" }}>
                Place your order in minutes. Your writer starts as soon as payment is confirmed.
              </p>
              <button onClick={()=>router.push("/register")}
                style={{ padding:".85rem 2rem", borderRadius:"12px", border:"none", background:"#38BDF8", color:"#0C1A2E", fontWeight:800, fontSize:".92rem", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                Hire a Writer Now →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
