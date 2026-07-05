"use client";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";

const stats = [
  { value:"10,000+", label:"Projects Delivered" },
  { value:"98%",     label:"On-Time Delivery"   },
  { value:"500+",    label:"Expert Writers"      },
  { value:"24/7",    label:"WhatsApp Support"    },
];

const reasons = [
  {
    icon:"🎓",
    title:"Writers Who Understand Academic Standards",
    body:"Every writer on our platform holds a postgraduate degree and has hands-on experience with the academic writing standards of their field. They know what supervisors look for, how to structure arguments, and how to write in a way that meets institutional requirements.",
  },
  {
    icon:"🔒",
    title:"Complete Confidentiality",
    body:"Your personal information and project details are never shared with anyone. Every order is handled with strict confidentiality — your identity, your topic, and your work remain entirely between you and our team.",
  },
  {
    icon:"⚡",
    title:"Real Experts, Not AI Generators",
    body:"Every chapter is written by a qualified human expert — not an AI tool. Your work goes through a quality review before delivery. You can track exactly who is working on each chapter and follow progress in real time from your dashboard.",
  },
  {
    icon:"✅",
    title:"Corrections Are Part of the Service",
    body:"On Standard and Professional plans, supervisor feedback and corrections are handled by our QC team at no extra charge. We don't consider a project complete until your supervisor does.",
  },
  {
    icon:"📞",
    title:"Always Reachable",
    body:"Our WhatsApp support line is monitored around the clock. Whether you need a progress update, want to send additional instructions, or have a question — you'll always reach a real person, fast.",
  },
  {
    icon:"💳",
    title:"Flexible, Secure Payment",
    body:"Pay in your local currency via card or bank transfer. We support multiple payment methods for students across Africa, the UK, and beyond. No hidden charges — the price you see is the price you pay.",
  },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight:"100vh", background:"#F0F9FF", fontFamily:"'DM Sans',sans-serif" }}>
      <PublicNav />

      {/* Hero */}
      <div style={{ background:"#0C1A2E", padding:"4rem 1.5rem", textAlign:"center" }}>
        <div style={{ maxWidth:"600px", margin:"0 auto" }}>
          <div style={{ display:"inline-block", background:"rgba(56,189,248,.15)", color:"#38BDF8", fontSize:".72rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", padding:".3rem .85rem", borderRadius:"999px", marginBottom:"1.25rem" }}>
            About iProjectMaster
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, color:"#fff", marginBottom:"1rem", lineHeight:1.3 }}>
            We exist to help students produce their best academic work.
          </h1>
          <p style={{ color:"#94A3B8", fontSize:".92rem", lineHeight:1.8 }}>
            iProjectMaster was built around a simple idea: every student deserves access to expert academic support — regardless of where they study or what resources their institution provides.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background:"#38BDF8", padding:"2rem 1.5rem" }}>
        <div style={{ maxWidth:"800px", margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:"1.5rem", textAlign:"center" }}>
          {stats.map(s => (
            <div key={s.value}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.8rem", fontWeight:800, color:"#0C1A2E" }}>{s.value}</div>
              <div style={{ fontSize:".78rem", color:"#0C4A6E", fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"3rem 1.5rem" }}>

        {/* Story */}
        <div style={{ background:"#fff", border:"1.5px solid #E0F2FE", borderRadius:"20px", padding:"2rem", marginBottom:"2rem" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1rem" }}>Our Story</h2>
          <p style={{ fontSize:".88rem", color:"#475569", lineHeight:1.9, marginBottom:"1rem" }}>
            iProjectMaster began as a response to a gap that too many students know well: the pressure of deadlines, complex academic requirements, and limited access to quality guidance. We set out to build a platform that connects students with subject-matter experts who can provide the kind of structured, professional support that makes a real difference.
          </p>
          <p style={{ fontSize:".88rem", color:"#475569", lineHeight:1.9, marginBottom:"1rem" }}>
            Today, our writers are specialists across dozens of disciplines — from business and health sciences to engineering, social sciences, law, and the humanities. Each one is selected through a rigorous vetting process and holds at least a postgraduate qualification in their field.
          </p>
          <p style={{ fontSize:".88rem", color:"#475569", lineHeight:1.9 }}>
            Every order is tracked chapter by chapter. Every piece of work goes through a quality review before it reaches you. And every client has direct access to our support team at any time.
          </p>
        </div>

        {/* Why us */}
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1.25rem" }}>
          Why Students Choose Us
        </h2>
        <div style={{ display:"grid", gap:"1rem", marginBottom:"2.5rem" }}>
          {reasons.map(r => (
            <div key={r.title} style={{ background:"#fff", border:"1.5px solid #E0F2FE", borderRadius:"14px", padding:"1.25rem", display:"flex", gap:"1rem" }}>
              <div style={{ fontSize:"1.5rem", flexShrink:0 }}>{r.icon}</div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:"#0C1A2E", fontSize:".9rem", marginBottom:".4rem" }}>{r.title}</div>
                <div style={{ fontSize:".82rem", color:"#475569", lineHeight:1.7 }}>{r.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Promise */}
        <div style={{ background:"#0C1A2E", borderRadius:"20px", padding:"2rem", textAlign:"center" }}>
          <div style={{ fontSize:"1.5rem", marginBottom:".75rem" }}>🤝</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#fff", marginBottom:".75rem" }}>
            Our Promise to You
          </h2>
          <p style={{ color:"#94A3B8", fontSize:".85rem", lineHeight:1.8, maxWidth:"480px", margin:"0 auto 1.5rem" }}>
            We will assign a qualified human expert to your work, keep you informed at every stage, and not consider the job done until you are satisfied. No disappearing acts. No AI-generated filler. Just professional academic support you can rely on.
          </p>
          <Link href="/register"
            style={{ display:"inline-block", padding:".85rem 2rem", borderRadius:"12px", background:"#38BDF8", color:"#0C1A2E", fontWeight:800, fontSize:".88rem", textDecoration:"none" }}>
            Start Your Order →
          </Link>
        </div>
      </div>
    </div>
  );
}
