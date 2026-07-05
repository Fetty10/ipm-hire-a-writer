"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicNav } from "@/components/PublicNav";

interface GeoInfo { currency:string; symbol:string; isNigeria:boolean; }
interface Plan { id:string; planName:string; priceKobo:number; pricingType:string; degreeGroup:string; includesPlagiarismCheck:boolean; priceUSD?:number|null; priceGBP?:number|null; priceGHS?:number|null; priceKES?:number|null; }

const PLAN_META: Record<string,{ tag:string; desc:string; features:string[]; notIncluded:string[]; border:string; badge:string|null; badgeBg:string; }> = {
  BASIC:            { tag:"Complete project, one price",    desc:"One flat payment covers your full project. Best for students who want everything done at once without needing correction support.", features:["All 5 chapters included","Writer + Analyst assigned"], notIncluded:["Supervisor corrections","School guideline application"], border:"#BAE6FD", badge:null, badgeBg:"" },
  STANDARD:         { tag:"Pay per chapter",                desc:"Pay only for the chapters you need, when you need them. Supervisor corrections and your school's guideline are handled.", features:["Pay per chapter","Writer + Analyst assigned","Supervisor corrections handled","School guideline applied"], notIncluded:["Plagiarism check"], border:"#38BDF8", badge:"Most Popular", badgeBg:"#38BDF8" },
  PROFESSIONAL:     { tag:"Per chapter + quality check",   desc:"Everything in Standard, plus a plagiarism and AI detection check before every delivery.", features:["Pay per chapter","Writer + Analyst assigned","Supervisor corrections handled","School guideline applied","Plagiarism & AI detection check"], notIncluded:[], border:"#818CF8", badge:"Best Value", badgeBg:"#818CF8" },
  PHD_PROFESSIONAL: { tag:"Doctoral writing standard",     desc:"Specialist PhD writers, doctoral-level rigour, full correction support and plagiarism check.", features:["Pay per chapter","Specialist PhD writer","Supervisor corrections handled","School guideline applied","Plagiarism & AI detection check"], notIncluded:[], border:"#F59E0B", badge:"PhD Only", badgeBg:"#F59E0B" },
};

const OTHER_SERVICES = [
  { name:"Seminar / Proposal", ond:10000, bsc:10000, pgd:20000, phd:50000, usd:{ ond:10,bsc:10,pgd:20,phd:50 } },
  { name:"Journal Writing",    ond:10000, bsc:10000, pgd:20000, phd:50000, usd:{ ond:10,bsc:10,pgd:20,phd:50 } },
  { name:"Assignment",         ond:10000, bsc:10000, pgd:20000, phd:50000, usd:{ ond:10,bsc:10,pgd:20,phd:50 } },
  { name:"PowerPoint",         ond:10000, bsc:10000, pgd:20000, phd:50000, usd:{ ond:10,bsc:10,pgd:20,phd:50 } },
  { name:"Topic Coining",      ond:1000,  bsc:1000,  pgd:1000,  phd:1000,  usd:{ ond:1, bsc:1, pgd:1, phd:1  }, note:"per topic" },
  { name:"Journal Sourcing",   ond:1000,  bsc:1000,  pgd:1000,  phd:1000,  usd:{ ond:1, bsc:1, pgd:1, phd:1  }, note:"per item" },
];

const DEG_KEYS = [
  { key:"OND_HND_NCE", label:"HND / OND / NCE" },
  { key:"BSC_BED_BA",  label:"BSc / BA / BEd"  },
  { key:"PGD_MSC_PHD", label:"PGD / MSc / MBA"  },
  { key:"PHD",         label:"PhD"              },
];

export default function PricingPage() {
  const router = useRouter();
  const [geo,    setGeo]    = useState<GeoInfo>({ currency:"NGN", symbol:"₦", isNigeria:true });
  const [plans,  setPlans]  = useState<Plan[]>([]);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/detect-country").then(r=>r.json()),
      fetch("/api/plans").then(r=>r.json()),
    ]).then(([g, p]) => {
      if (g) setGeo({ currency:g.currency||"NGN", symbol:g.symbol||"₦", isNigeria:g.isNigeria!==false });
      if (p.success) setPlans(p.data);
      setLoading(false);
    });
  }, []);

  function getPrice(plan: Plan): number {
    if (!geo.isNigeria) {
      const intlKey = `price${geo.currency}` as keyof Plan;
      const intlVal = plan[intlKey] as number|null;
      if (intlVal) return intlVal / 100;
      // fallback to USD if no specific currency
      if (plan.priceUSD) return plan.priceUSD / 100;
    }
    return plan.priceKobo / 100;
  }

  function fmt(amount: number): string {
    return `${geo.symbol}${amount.toLocaleString()}`;
  }

  // Group plans by name (take first occurrence for display)
  const uniquePlans = ["BASIC","STANDARD","PROFESSIONAL","PHD_PROFESSIONAL"].map(name => {
    const found = plans.find(p => p.planName === name);
    return found ? { ...found, meta: PLAN_META[name] } : null;
  }).filter(Boolean) as (Plan & { meta: typeof PLAN_META[string] })[];

  // For the price table, group by planName → degreeGroup
  function getPlanPriceForDeg(planName: string, degGroup: string): string {
    const plan = plans.find(p => p.planName === planName && p.degreeGroup === degGroup);
    if (!plan) return "—";
    const price = getPrice(plan);
    if (price === 0) return "—";
    return `${fmt(price)}${plan.pricingType === "PER_CHAPTER" ? "/ch" : " (flat)"}`;
  }

  function getOtherPrice(svc: typeof OTHER_SERVICES[0], deg: string): string {
    const isIntl = !geo.isNigeria;
    if (isIntl) {
      const p = svc.usd[deg as keyof typeof svc.usd] as number;
      return `$${p}${svc.note ? "" : ""}`;
    }
    const p = svc[deg as keyof typeof svc] as number;
    if (typeof p !== "number") return "—";
    return `₦${p.toLocaleString()}`;
  }

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
          <p style={{ fontSize:".9rem", color:"#5B7EA6", maxWidth:"500px", margin:"0 auto", lineHeight:1.7 }}>
            {geo.isNigeria
              ? "All prices in Nigerian Naira (₦). Pay via card or bank transfer."
              : `Prices shown in ${geo.currency}. Pay securely via Flutterwave in your local currency.`}
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
              {uniquePlans.map(p => {
                const price = getPrice(p);
                const isDark = p.planName === "PHD_PROFESSIONAL";
                return (
                  <div key={p.planName} style={{ background: isDark ? "#0C1A2E" : "#fff", border:`2px solid ${p.meta.border}`, borderRadius:"16px", padding:"1.5rem", display:"flex", flexDirection:"column", position:"relative" }}>
                    {p.meta.badge && (
                      <div style={{ position:"absolute", top:"-12px", left:"50%", transform:"translateX(-50%)", background:p.meta.badgeBg, color: p.planName==="PHD_PROFESSIONAL"?"#0C1A2E":"#0C1A2E", fontSize:".65rem", fontWeight:700, padding:".2rem .75rem", borderRadius:"999px", whiteSpace:"nowrap" }}>
                        {p.meta.badge}
                      </div>
                    )}
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:800, color: isDark?"#fff":"#0C1A2E", marginBottom:".2rem" }}>{p.planName.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</div>
                    <div style={{ fontSize:".72rem", color: isDark?"#94A3B8":"#5B7EA6", marginBottom:".75rem" }}>{p.meta.tag}</div>
                    {price > 0 && (
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.25rem", fontWeight:800, color: isDark?"#38BDF8":"#0C1A2E", marginBottom:".25rem" }}>
                        {fmt(price)}{p.pricingType==="PER_CHAPTER" ? <span style={{fontSize:".7rem",fontWeight:400,color:isDark?"#94A3B8":"#5B7EA6"}}>/chapter</span> : <span style={{fontSize:".7rem",fontWeight:400,color:isDark?"#94A3B8":"#5B7EA6"}}> flat</span>}
                      </div>
                    )}
                    <div style={{ fontSize:".78rem", color: isDark?"#CBD5E1":"#5B7EA6", lineHeight:1.6, marginBottom:"1rem", flex:1 }}>{p.meta.desc}</div>
                    <ul style={{ listStyle:"none", padding:0, margin:"0 0 1.25rem", display:"flex", flexDirection:"column", gap:".4rem" }}>
                      {p.meta.features.map((f,i) => (
                        <li key={i} style={{ fontSize:".75rem", color:isDark?"#E2E8F0":"#0C1A2E", display:"flex", gap:".5rem" }}>
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
                        background: isDark?"#38BDF8": p.planName==="PROFESSIONAL"?"#818CF8":"#0C1A2E",
                        color: isDark?"#0C1A2E":"#fff" }}>
                      Get Started →
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Price by degree level table */}
            <div style={{ background:"#fff", border:"1.5px solid #E0F2FE", borderRadius:"16px", padding:"1.5rem", marginBottom:"3rem" }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:".95rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1rem" }}>
                📊 Price by Academic Level
              </h3>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".82rem" }}>
                  <thead>
                    <tr style={{ background:"#F0F9FF" }}>
                      <th style={{ padding:".6rem .75rem", textAlign:"left", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>Plan</th>
                      {DEG_KEYS.map(d => (
                        <th key={d.key} style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>{d.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["BASIC","STANDARD","PROFESSIONAL","PHD_PROFESSIONAL"].map((planName,i) => (
                      <tr key={planName} style={{ borderBottom:"1px solid #F0F9FF", background: i%2===0?"#fff":"#FAFCFF" }}>
                        <td style={{ padding:".65rem .75rem", fontWeight:700, color:"#0C1A2E" }}>
                          {planName.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                        </td>
                        {DEG_KEYS.map(d => (
                          <td key={d.key} style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>
                            {planName === "PHD_PROFESSIONAL" && d.key !== "PHD" ? "—" :
                             planName !== "PHD_PROFESSIONAL" && d.key === "PHD" ? "—" :
                             geo.isNigeria ? getPlanPriceForDeg(planName, d.key) : "Contact us"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!geo.isNigeria && (
                <p style={{ fontSize:".72rem", color:"#5B7EA6", marginTop:".75rem" }}>
                  💬 International pricing varies by degree level and currency. <a href="https://wa.me/2348132926373" style={{color:"#0369A1",fontWeight:700}}>Chat with us</a> for a quote, or go straight to the order form to see your exact price.
                </p>
              )}
              {geo.isNigeria && (
                <p style={{ fontSize:".72rem", color:"#5B7EA6", marginTop:".75rem" }}>* "/ch" = per chapter. Basic plan covers all 5 chapters at a flat price.</p>
              )}
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
                      <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>HND / OND</th>
                      <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>BSc / BA</th>
                      <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>PGD / MSc</th>
                      <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>PhD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OTHER_SERVICES.map((s,i) => (
                      <tr key={s.name} style={{ borderBottom:"1px solid #F0F9FF", background: i%2===0?"#fff":"#FAFCFF" }}>
                        <td style={{ padding:".65rem .75rem", fontWeight:700, color:"#0C1A2E" }}>
                          {s.name}
                          {s.note && <span style={{ fontWeight:400, color:"#5B7EA6", fontSize:".7rem", marginLeft:".4rem" }}>({s.note})</span>}
                        </td>
                        <td style={{ padding:".65rem .75rem", textAlign:"center" }}>{getOtherPrice(s,"ond")}</td>
                        <td style={{ padding:".65rem .75rem", textAlign:"center" }}>{getOtherPrice(s,"bsc")}</td>
                        <td style={{ padding:".65rem .75rem", textAlign:"center" }}>{getOtherPrice(s,"pgd")}</td>
                        <td style={{ padding:".65rem .75rem", textAlign:"center" }}>{getOtherPrice(s,"phd")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!geo.isNigeria && (
                <p style={{ fontSize:".72rem", color:"#5B7EA6", marginTop:".75rem" }}>
                  * Prices shown in USD for reference. You'll pay in your local currency at checkout via Flutterwave.
                </p>
              )}
            </div>

            {/* Payment methods */}
            <div style={{ background:"#fff", border:"1.5px solid #E0F2FE", borderRadius:"16px", padding:"1.5rem", marginBottom:"3rem", display:"flex", flexWrap:"wrap" as const, gap:"1rem" }}>
              <div style={{ flex:"1", minWidth:"200px" }}>
                <div style={{ fontWeight:700, color:"#0C1A2E", marginBottom:".4rem", fontSize:".85rem" }}>💳 How to Pay</div>
                {geo.isNigeria ? (
                  <ul style={{ listStyle:"none", padding:0, margin:0, fontSize:".82rem", color:"#475569", display:"flex", flexDirection:"column" as const, gap:".3rem" }}>
                    <li>✓ Card payment via Paystack</li>
                    <li>✓ Bank transfer (manual confirmation)</li>
                    <li>✓ USSD and mobile banking</li>
                  </ul>
                ) : (
                  <ul style={{ listStyle:"none", padding:0, margin:0, fontSize:".82rem", color:"#475569", display:"flex", flexDirection:"column" as const, gap:".3rem" }}>
                    <li>✓ Card payment via Flutterwave</li>
                    <li>✓ Pay in your local currency</li>
                    <li>✓ Mobile money (where supported)</li>
                  </ul>
                )}
              </div>
              <div style={{ flex:"1", minWidth:"200px" }}>
                <div style={{ fontWeight:700, color:"#0C1A2E", marginBottom:".4rem", fontSize:".85rem" }}>🔒 Secure & Guaranteed</div>
                <ul style={{ listStyle:"none", padding:0, margin:0, fontSize:".82rem", color:"#475569", display:"flex", flexDirection:"column" as const, gap:".3rem" }}>
                  <li>✓ No hidden charges</li>
                  <li>✓ Refund policy in place</li>
                  <li>✓ Work starts immediately after payment</li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div style={{ background:"#0C1A2E", borderRadius:"20px", padding:"2.5rem", textAlign:"center" }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.4rem", fontWeight:800, color:"#fff", marginBottom:".75rem" }}>
                Ready to get started?
              </h2>
              <p style={{ color:"#94A3B8", fontSize:".88rem", marginBottom:"1.5rem" }}>
                Place your order in minutes. Your writer is assigned as soon as payment is confirmed.
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
