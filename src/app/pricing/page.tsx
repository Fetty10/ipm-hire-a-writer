"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicNav } from "@/components/PublicNav";

interface GeoInfo { currency:string; symbol:string; isNigeria:boolean; }

const plans = [
  {
    name: "Basic",
    planKey: "BASIC",
    tag: "Full project, one price",
    desc: "One flat payment covers your entire project (Chapters 1–5). Best if you want everything done at once.",
    features: ["All 5 chapters included", "Writer + Analyst assigned", "No corrections handling", "School guideline not applied"],
    notIncluded: ["Corrections", "Guideline usage"],
    border: "#BAE6FD",
    badge: null,
    badgeBg: "",
    dark: false,
    ngn: { ond:12000, bsc:12000, pgd:20000 },
    usd: { ond:12,    bsc:12,    pgd:20    },
  },
  {
    name: "Standard",
    planKey: "STANDARD",
    tag: "Pay per chapter",
    desc: "Pay for only the chapters you need. Supervisor corrections handled. Your school format applied.",
    features: ["Pay per chapter", "Writer + Analyst assigned", "Supervisor corrections handled", "School guideline applied"],
    notIncluded: ["Plagiarism check"],
    border: "#38BDF8",
    badge: "Most Popular",
    badgeBg: "#38BDF8",
    dark: false,
    ngn: { ond:7000,  bsc:7000,  pgd:10000 },
    usd: { ond:7,     bsc:7,     pgd:10    },
  },
  {
    name: "Professional",
    planKey: "PROFESSIONAL",
    tag: "Pay per chapter + QC",
    desc: "Everything in Standard, plus plagiarism and AI detection check before delivery.",
    features: ["Pay per chapter", "Writer + Analyst assigned", "Supervisor corrections handled", "School guideline applied", "Plagiarism & AI check included"],
    notIncluded: [],
    border: "#818CF8",
    badge: "Best Value",
    badgeBg: "#818CF8",
    dark: false,
    ngn: { ond:12000, bsc:12000, pgd:20000 },
    usd: { ond:12,    bsc:12,    pgd:20    },
  },
  {
    name: "PhD Professional",
    planKey: "PHD_PROFESSIONAL",
    tag: "Doctoral standard",
    desc: "Tailored specifically for PhD writing with doctoral-level rigour and plagiarism check.",
    features: ["Per chapter", "Specialist PhD writer assigned", "Supervisor corrections handled", "School guideline applied", "Plagiarism & AI check included"],
    notIncluded: [],
    border: "#0C1A2E",
    badge: "PhD Only",
    badgeBg: "#475569",
    dark: true,
    ngn: { phd:50000 },
    usd: { phd:50    },
  },
];

const otherServices = [
  { name:"Seminar / Proposal", ngn:{ ond:10000, bsc:10000, pgd:20000, phd:50000 }, usd:{ ond:10, bsc:10, pgd:20, phd:50 } },
  { name:"Journal Writing",    ngn:{ ond:10000, bsc:10000, pgd:20000, phd:50000 }, usd:{ ond:10, bsc:10, pgd:20, phd:50 } },
  { name:"Assignment",         ngn:{ ond:10000, bsc:10000, pgd:20000, phd:50000 }, usd:{ ond:10, bsc:10, pgd:20, phd:50 } },
  { name:"PowerPoint",         ngn:{ ond:10000, bsc:10000, pgd:20000, phd:50000 }, usd:{ ond:10, bsc:10, pgd:20, phd:50 } },
  { name:"Topic Coining",      ngn:{ ond:1000,  bsc:1000,  pgd:1000,  phd:1000  }, usd:{ ond:1,  bsc:1,  pgd:1,  phd:1  }, note:"per topic" },
  { name:"Journal Sourcing",   ngn:{ ond:1000,  bsc:1000,  pgd:1000,  phd:1000  }, usd:{ ond:1,  bsc:1,  pgd:1,  phd:1  }, note:"per item"  },
];

const degTable = [
  { planName:"Basic",           ond:"12,000 (flat)", bsc:"12,000 (flat)", pgd:"20,000 (flat)", phd:"—",   uOnd:"12 (flat)", uBsc:"12 (flat)", uPgd:"20 (flat)", uPhd:"—"   },
  { planName:"Standard",        ond:"7,000/ch",      bsc:"7,000/ch",      pgd:"10,000/ch",     phd:"—",   uOnd:"7/ch",      uBsc:"7/ch",      uPgd:"10/ch",     uPhd:"—"   },
  { planName:"Professional",    ond:"12,000/ch",     bsc:"12,000/ch",     pgd:"20,000/ch",     phd:"—",   uOnd:"12/ch",     uBsc:"12/ch",     uPgd:"20/ch",     uPhd:"—"   },
  { planName:"PhD Professional",ond:"—",             bsc:"—",             pgd:"—",             phd:"50,000/ch", uOnd:"—",  uBsc:"—",         uPgd:"—",         uPhd:"50/ch"},
];

export default function PricingPage() {
  const router = useRouter();
  const [geo, setGeo] = useState<GeoInfo>({ currency:"NGN", symbol:"₦", isNigeria:true });

  useEffect(() => {
    fetch("/api/detect-country").then(r=>r.json()).then(g => {
      if (g) setGeo({ currency:g.currency||"NGN", symbol:g.symbol||"₦", isNigeria:g.isNigeria!==false });
    });
  }, []);

  const s = geo.symbol;

  function fmt(ngn: number, usd: number) {
    return geo.isNigeria ? `${s}${ngn.toLocaleString()}` : `$${usd}`;
  }

  function fmtTable(ngnStr: string, usdStr: string) {
    if (geo.isNigeria) return ngnStr === "—" ? "—" : `${s}${ngnStr}`;
    return usdStr === "—" ? "—" : `$${usdStr}`;
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
          <p style={{ fontSize:".92rem", color:"#5B7EA6", maxWidth:"500px", margin:"0 auto", lineHeight:1.7 }}>
            {geo.isNigeria
              ? "All prices in Nigerian Naira (₦). Pay via card or bank transfer."
              : `Prices shown in USD. You'll pay in your local currency (${geo.currency}) at checkout.`}
          </p>
        </div>

        {/* Plan cards */}
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1.25rem" }}>
          📚 Project / Thesis / Dissertation Plans
        </h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"1rem", marginBottom:"3rem" }}>
          {plans.map(p => (
            <div key={p.name} style={{ background: p.dark?"#0C1A2E":"#fff", border:`2px solid ${p.border}`, borderRadius:"16px", padding:"1.5rem", display:"flex", flexDirection:"column", position:"relative" }}>
              {p.badge && (
                <div style={{ position:"absolute", top:"-12px", left:"50%", transform:"translateX(-50%)", background:p.badgeBg, color:"#0C1A2E", fontSize:".65rem", fontWeight:700, padding:".2rem .75rem", borderRadius:"999px", whiteSpace:"nowrap" }}>
                  {p.badge}
                </div>
              )}
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.05rem", fontWeight:800, color:p.dark?"#fff":"#0C1A2E", marginBottom:".2rem" }}>{p.name}</div>
              <div style={{ fontSize:".72rem", color:p.dark?"#94A3B8":"#5B7EA6", marginBottom:"1rem" }}>{p.tag}</div>
              <div style={{ fontSize:".8rem", color:p.dark?"#CBD5E1":"#5B7EA6", lineHeight:1.6, marginBottom:"1.25rem", flex:1 }}>{p.desc}</div>
              <ul style={{ listStyle:"none", padding:0, margin:"0 0 1.25rem", display:"flex", flexDirection:"column", gap:".4rem" }}>
                {p.features.map((f,i) => (
                  <li key={i} style={{ fontSize:".75rem", color:p.dark?"#E2E8F0":"#0C1A2E", display:"flex", gap:".5rem" }}>
                    <span style={{color:"#22C55E",flexShrink:0}}>✓</span>{f}
                  </li>
                ))}
                {p.notIncluded.map((f,i) => (
                  <li key={i} style={{ fontSize:".75rem", color:"#94A3B8", display:"flex", gap:".5rem", textDecoration:"line-through" }}>
                    <span style={{flexShrink:0}}>✕</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={()=>router.push(`/register?plan=${p.planKey}`)}
                style={{ padding:".7rem", borderRadius:"10px", border:"none", cursor:"pointer", fontWeight:700, fontSize:".82rem", fontFamily:"'DM Sans',sans-serif",
                  background: p.dark?"#38BDF8": p.planKey==="PROFESSIONAL"?"#818CF8":"#0C1A2E",
                  color: p.dark?"#0C1A2E":"#fff" }}>
                Get Started →
              </button>
            </div>
          ))}
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
                  {["Plan","HND / OND / NCE","BSc / BEd / BA","PGD / MSc / MBA","PhD"].map(h => (
                    <th key={h} style={{ padding:".6rem .75rem", textAlign: h==="Plan"?"left":"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {degTable.map((r,i) => (
                  <tr key={i} style={{ borderBottom:"1px solid #F0F9FF" }}>
                    <td style={{ padding:".65rem .75rem", fontWeight:700, color:"#0C1A2E" }}>{r.planName}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>{fmtTable(r.ond, r.uOnd)}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>{fmtTable(r.bsc, r.uBsc)}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>{fmtTable(r.pgd, r.uPgd)}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>{fmtTable(r.phd, r.uPhd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize:".72rem", color:"#5B7EA6", marginTop:".75rem" }}>
            * "/ch" = per chapter. Basic plan covers all 5 chapters at a flat price.
            {!geo.isNigeria && " Prices shown in USD — you pay in your local currency at checkout."}
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
                  {["Service","HND / OND","BSc / BA","PGD / MSc","PhD"].map(h => (
                    <th key={h} style={{ padding:".6rem .75rem", textAlign:h==="Service"?"left":"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {otherServices.map((sv,i) => (
                  <tr key={i} style={{ borderBottom:"1px solid #F0F9FF" }}>
                    <td style={{ padding:".65rem .75rem", fontWeight:700, color:"#0C1A2E" }}>
                      {sv.name}
                      {sv.note && <span style={{ fontWeight:400, color:"#5B7EA6", fontSize:".7rem", marginLeft:".4rem" }}>({sv.note})</span>}
                    </td>
                    {(["ond","bsc","pgd","phd"] as const).map(deg => (
                      <td key={deg} style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>
                        {geo.isNigeria ? `${s}${sv.ngn[deg].toLocaleString()}` : `$${sv.usd[deg]}`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!geo.isNigeria && (
            <p style={{ fontSize:".72rem", color:"#5B7EA6", marginTop:".75rem" }}>
              * Prices in USD. You'll pay in your local currency ({geo.currency}) at checkout.
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
      </div>
    </div>
  );
}
