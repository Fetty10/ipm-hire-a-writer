"use client";
export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";

const plans = [
  {
    name: "Basic",
    tag: "Full project, one price",
    desc: "One flat payment covers your entire project (Chapters 1–5). Best if you want everything done at once.",
    features: ["All 5 chapters included", "Writer + Analyst assigned", "No corrections handling", "School guideline not applied"],
    notIncluded: ["Corrections", "Guideline usage"],
    prices: { ond: 12000, bsc: 12000, pgd: 20000 },
    color: "#F0F9FF",
    border: "#BAE6FD",
    badge: null,
    cta: "BASIC",
  },
  {
    name: "Standard",
    tag: "Pay per chapter",
    desc: "Pay for only the chapters you need. Supervisor corrections handled. Your school format applied.",
    features: ["Pay per chapter (₦7,000 OND/BSc · ₦10,000 PGD)", "Writer + Analyst assigned", "Supervisor corrections handled", "School guideline applied"],
    notIncluded: ["Plagiarism check"],
    prices: { ond: 7000, bsc: 7000, pgd: 10000 },
    color: "#fff",
    border: "#38BDF8",
    badge: "Most Popular",
    cta: "STANDARD",
  },
  {
    name: "Professional",
    tag: "Pay per chapter + QC",
    desc: "Everything in Standard, plus plagiarism and AI detection check before delivery.",
    features: ["Pay per chapter (₦12,000 OND/BSc · ₦20,000 PGD)", "Writer + Analyst assigned", "Supervisor corrections handled", "School guideline applied", "Plagiarism & AI check included"],
    notIncluded: [],
    prices: { ond: 12000, bsc: 12000, pgd: 20000 },
    color: "#fff",
    border: "#818CF8",
    badge: "Best Value",
    cta: "PROFESSIONAL",
  },
  {
    name: "PhD Professional",
    tag: "Doctoral standard",
    desc: "Tailored specifically for PhD writing with doctoral-level rigour and plagiarism check.",
    features: ["₦50,000 per chapter", "Specialist PhD writer assigned", "Supervisor corrections handled", "School guideline applied", "Plagiarism & AI check included"],
    notIncluded: [],
    prices: { phd: 50000 },
    color: "#0C1A2E",
    border: "#0C1A2E",
    badge: "PhD Only",
    cta: "PHD_PROFESSIONAL",
  },
];

const otherServices = [
  { name:"Seminar / Proposal", ond:10000, bsc:10000, pgd:20000, phd:50000 },
  { name:"Journal Writing", ond:10000, bsc:10000, pgd:20000, phd:50000 },
  { name:"Assignment", ond:10000, bsc:10000, pgd:20000, phd:50000 },
  { name:"PowerPoint", ond:10000, bsc:10000, pgd:20000, phd:50000 },
  { name:"Topic Coining", ond:1000, bsc:1000, pgd:1000, phd:1000, note:"per topic" },
  { name:"Journal Sourcing", ond:1000, bsc:1000, pgd:1000, phd:1000, note:"per journal" },
];

export default function PricingPage() {
  const router = useRouter();

  function goToRegister(plan: string) {
    router.push(`/register?plan=${plan}`);
  }

  return (
    <div style={{ minHeight:"100vh", background:"#F0F9FF", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
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
            All prices are in Nigerian Naira (₦). International students pay in their local currency via Flutterwave.
          </p>
        </div>

        {/* Project Plans */}
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1.25rem" }}>
          📚 Project / Thesis / Dissertation Plans
        </h2>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:"1rem", marginBottom:"3rem" }}>
          {plans.map(p => (
            <div key={p.name} style={{ background:p.color, border:`2px solid ${p.border}`, borderRadius:"16px", padding:"1.5rem", display:"flex", flexDirection:"column", position:"relative" }}>
              {p.badge && (
                <div style={{ position:"absolute", top:"-12px", left:"50%", transform:"translateX(-50%)", background: p.name==="Standard"?"#38BDF8":p.name==="Professional"?"#818CF8":"#475569", color: p.name==="PhD Professional"?"#fff":"#0C1A2E", fontSize:".65rem", fontWeight:700, padding:".2rem .75rem", borderRadius:"999px", whiteSpace:"nowrap" }}>
                  {p.badge}
                </div>
              )}
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.05rem", fontWeight:800, color: p.name==="PhD Professional"?"#fff":"#0C1A2E", marginBottom:".2rem" }}>{p.name}</div>
              <div style={{ fontSize:".72rem", color: p.name==="PhD Professional"?"#94A3B8":"#5B7EA6", marginBottom:"1rem" }}>{p.tag}</div>
              <div style={{ fontSize:".8rem", color: p.name==="PhD Professional"?"#CBD5E1":"#5B7EA6", lineHeight:1.6, marginBottom:"1.25rem", flex:1 }}>{p.desc}</div>

              <ul style={{ listStyle:"none", padding:0, margin:"0 0 1.25rem", display:"flex", flexDirection:"column", gap:".4rem" }}>
                {p.features.map((f,i) => (
                  <li key={i} style={{ fontSize:".75rem", color:p.name==="PhD Professional"?"#E2E8F0":"#0C1A2E", display:"flex", gap:".5rem" }}>
                    <span style={{color:"#22C55E",flexShrink:0}}>✓</span>{f}
                  </li>
                ))}
                {p.notIncluded.map((f,i) => (
                  <li key={i} style={{ fontSize:".75rem", color:"#94A3B8", display:"flex", gap:".5rem", textDecoration:"line-through" }}>
                    <span style={{flexShrink:0}}>✕</span>{f}
                  </li>
                ))}
              </ul>

              <button onClick={()=>goToRegister(p.cta)}
                style={{ padding:".7rem", borderRadius:"10px", border:"none", cursor:"pointer", fontWeight:700, fontSize:".82rem", fontFamily:"'DM Sans',sans-serif",
                  background: p.name==="PhD Professional"?"#38BDF8": p.name==="Professional"?"#818CF8":"#0C1A2E",
                  color: p.name==="PhD Professional"?"#0C1A2E":"#fff" }}>
                Get Started →
              </button>
            </div>
          ))}
        </div>

        {/* Degree level price table */}
        <div style={{ background:"#fff", border:"1.5px solid #E0F2FE", borderRadius:"16px", padding:"1.5rem", marginBottom:"3rem" }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:".95rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1rem" }}>
            📊 Price by Degree Level (Project Plans)
          </h3>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".82rem" }}>
              <thead>
                <tr style={{ background:"#F0F9FF" }}>
                  <th style={{ padding:".6rem .75rem", textAlign:"left", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>Plan</th>
                  <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>OND / HND / NCE</th>
                  <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>BSc / BEd / BA</th>
                  <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>PGD / MSc / MBA</th>
                  <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>PhD</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name:"Basic", ond:"₦12,000 (flat)", bsc:"₦12,000 (flat)", pgd:"₦20,000 (flat)", phd:"—" },
                  { name:"Standard", ond:"₦7,000/ch", bsc:"₦7,000/ch", pgd:"₦10,000/ch", phd:"—" },
                  { name:"Professional", ond:"₦12,000/ch", bsc:"₦12,000/ch", pgd:"₦20,000/ch", phd:"—" },
                  { name:"PhD Professional", ond:"—", bsc:"—", pgd:"—", phd:"₦50,000/ch" },
                ].map((r,i) => (
                  <tr key={i} style={{ borderBottom:"1px solid #F0F9FF" }}>
                    <td style={{ padding:".65rem .75rem", fontWeight:700, color:"#0C1A2E" }}>{r.name}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>{r.ond}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>{r.bsc}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>{r.pgd}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center", color:"#0C1A2E" }}>{r.phd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize:".72rem", color:"#5B7EA6", marginTop:".75rem" }}>* "ch" = per chapter. Basic plan covers all 5 chapters at one flat price.</p>
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
                  <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>OND/HND</th>
                  <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>BSc/BA</th>
                  <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>PGD/MSc</th>
                  <th style={{ padding:".6rem .75rem", textAlign:"center", color:"#5B7EA6", fontWeight:700, fontSize:".7rem", textTransform:"uppercase", letterSpacing:".06em", borderBottom:"1px solid #E0F2FE" }}>PhD</th>
                </tr>
              </thead>
              <tbody>
                {otherServices.map((s,i) => (
                  <tr key={i} style={{ borderBottom:"1px solid #F0F9FF" }}>
                    <td style={{ padding:".65rem .75rem", fontWeight:700, color:"#0C1A2E" }}>
                      {s.name}
                      {s.note && <span style={{ fontWeight:400, color:"#5B7EA6", fontSize:".7rem", marginLeft:".4rem" }}>({s.note})</span>}
                    </td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center" }}>₦{s.ond.toLocaleString()}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center" }}>₦{s.bsc.toLocaleString()}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center" }}>₦{s.pgd.toLocaleString()}</td>
                    <td style={{ padding:".65rem .75rem", textAlign:"center" }}>₦{s.phd.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
