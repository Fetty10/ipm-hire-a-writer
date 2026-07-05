"use client";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";

const stats = [
  { value:"10,000+", label:"Projects Delivered" },
  { value:"98%", label:"On-Time Delivery" },
  { value:"500+", label:"Expert Writers" },
  { value:"24/7", label:"Support via WhatsApp" },
];

const reasons = [
  {
    icon:"🎓",
    title:"Writers Who Understand Nigerian Academia",
    body:"Every writer on our platform has passed through the Nigerian university system. They understand your school's format, your department's expectations, and the exact structure your supervisor is looking for — not a generic academic template from the internet.",
  },
  {
    icon:"🔒",
    title:"Your Privacy is Guaranteed",
    body:"We do not share your personal information or project details with anyone. Every order is handled with complete confidentiality. Your name, topic, and identity remain strictly between you and us.",
  },
  {
    icon:"⚡",
    title:"Real Deadlines, Real Writers",
    body:"We assign your work to a human expert — not an AI generator. Every chapter goes through a quality check before delivery. You'll see exactly who is working on each chapter and track progress in real time.",
  },
  {
    icon:"✅",
    title:"Corrections Are Part of the Deal",
    body:"On Standard and Professional plans, your supervisor's corrections are handled by our QC team at no extra charge. We don't consider a project done until your supervisor does.",
  },
  {
    icon:"📞",
    title:"We're Always Reachable",
    body:"Our WhatsApp line is monitored around the clock. Whether you have a question about your order, need to send additional instructions, or want a progress update — you'll always reach a real person.",
  },
  {
    icon:"💳",
    title:"Pay Your Way",
    body:"Nigerian students pay via Paystack (card) or bank transfer. International students pay in their local currency via Flutterwave. No hidden charges. What you see on the pricing page is exactly what you pay.",
  },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight:"100vh", background:"#F0F9FF", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
      <PublicNav />

      {/* Hero */}
      <div style={{ background:"#0C1A2E", padding:"4rem 1.5rem", textAlign:"center" }}>
        <div style={{ maxWidth:"600px", margin:"0 auto" }}>
          <div style={{ display:"inline-block", background:"rgba(56,189,248,.15)", color:"#38BDF8", fontSize:".72rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", padding:".3rem .85rem", borderRadius:"999px", marginBottom:"1.25rem" }}>
            About iProjectMaster
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"2rem", fontWeight:800, color:"#fff", marginBottom:"1rem", lineHeight:1.3 }}>
            We exist to help Nigerian students finish their academic work — properly.
          </h1>
          <p style={{ color:"#94A3B8", fontSize:".92rem", lineHeight:1.8 }}>
            iProjectMaster started with one simple observation: too many students were submitting poor-quality projects not because they lacked intelligence, but because they lacked time, guidance, and access to expert help. We built this platform to close that gap.
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

      {/* Main content */}
      <div style={{ maxWidth:"760px", margin:"0 auto", padding:"3rem 1.5rem" }}>

        {/* Story */}
        <div style={{ background:"#fff", border:"1.5px solid #E0F2FE", borderRadius:"20px", padding:"2rem", marginBottom:"2rem" }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.2rem", fontWeight:800, color:"#0C1A2E", marginBottom:"1rem" }}>Our Story</h2>
          <p style={{ fontSize:".88rem", color:"#475569", lineHeight:1.9, marginBottom:"1rem" }}>
            iProjectMaster is one of Nigeria's longest-running academic writing platforms. We've helped students from over 200 universities across Nigeria — from UniLag to UNIPORT, from Covenant University to Kano State Polytechnic — complete their final year projects, dissertations, assignments, seminar papers, and proposals.
          </p>
          <p style={{ fontSize:".88rem", color:"#475569", lineHeight:1.9, marginBottom:"1rem" }}>
            Our writers are Nigerian graduates and postgraduates who have written and defended their own projects through this same system. They know your school's formatting requirements, what supervisors typically ask for, and how to write in a way that passes originality checks.
          </p>
          <p style={{ fontSize:".88rem", color:"#475569", lineHeight:1.9 }}>
            Unlike generic essay mills, every writer on our platform is vetted, every chapter is reviewed by a quality control officer, and every order is tracked — chapter by chapter — in real time.
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
        <div style={{ background:"#0C1A2E", borderRadius:"20px", padding:"2rem", textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ fontSize:"1.5rem", marginBottom:".75rem" }}>🤝</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.1rem", fontWeight:800, color:"#fff", marginBottom:".75rem" }}>
            Our Promise to You
          </h2>
          <p style={{ color:"#94A3B8", fontSize:".85rem", lineHeight:1.8, maxWidth:"480px", margin:"0 auto 1.5rem" }}>
            We will not take your money and disappear. We will not deliver AI-generated text disguised as expert writing. We will assign a real human writer to your work, keep you updated at every stage, and not consider the job done until you are satisfied.
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
