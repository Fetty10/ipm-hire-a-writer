"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";

const faqs = [
  {
    category:"Getting Started",
    items:[
      {
        q:"How do I place an order?",
        a:"Visit hire.iprojectmaster.com/register, fill in your project topic, select your degree level and plan, then complete payment. Your order is assigned to a writer immediately after payment is confirmed.",
      },
      {
        q:"Do I need to create an account before I can order?",
        a:"No — you can fill in your order details and pay all on the registration page. Your account is created automatically when payment is confirmed. You then use your email and password to log in and track progress.",
      },
      {
        q:"Which payment methods do you accept?",
        a:"Nigerian students can pay via Paystack (card, bank transfer, USSD) or direct bank transfer. International students can pay in their local currency via Flutterwave. All payments are processed securely.",
      },
      {
        q:"How long does it take for my order to be assigned after payment?",
        a:"For card payments (Paystack/Flutterwave), assignment is automatic — your writer receives the job within minutes of payment confirmation. For bank transfers, assignment happens once our team verifies your payment, usually within 30 minutes during business hours.",
      },
    ],
  },
  {
    category:"Plans & Pricing",
    items:[
      {
        q:"What is the difference between Basic, Standard, and Professional?",
        a:"Basic is a flat price for all 5 chapters — best if you want everything at once without needing corrections. Standard and Professional are per-chapter and include supervisor correction handling and your school's guideline. Professional adds a plagiarism and AI detection check before delivery.",
      },
      {
        q:"Can I choose which chapters to order?",
        a:"Yes — on Standard and Professional plans you select exactly which chapters you want. You can order Chapter 1 now and add more chapters later as your project progresses.",
      },
      {
        q:"Are there extra charges after I pay?",
        a:"No hidden charges. What you see on the pricing page is what you pay. Corrections are included in Standard and Professional plans at no extra cost.",
      },
      {
        q:"Do you work on seminar papers, proposals, and assignments too?",
        a:"Yes. We handle Seminar papers, Proposals, Journal Writing, Journal Sourcing, PowerPoint presentations, and Assignments. Pricing varies by degree level — check our pricing page for details.",
      },
    ],
  },
  {
    category:"Quality & Writers",
    items:[
      {
        q:"Who are your writers?",
        a:"All our writers are Nigerian graduates and postgraduates — people who have gone through the same university system as you. They are vetted through a rigorous application and sample-writing process before being admitted to the platform.",
      },
      {
        q:"Is the work written by a real person or AI?",
        a:"Every chapter is written by a real human expert. We do not use AI generators to produce your work. Our Professional plan includes an AI detection check to give you additional confidence.",
      },
      {
        q:"Will my school's format and guideline be followed?",
        a:"Yes — on Standard and Professional plans, you can upload your school's format guide or supervisor's notes, and our writer will follow it. On the Basic plan, a general academic format is used.",
      },
      {
        q:"What if my supervisor asks for corrections?",
        a:"On Standard and Professional plans, supervisor corrections are handled by our QC team at no extra charge. Simply log in, go to your Corrections tab, and submit the feedback. Our team handles the rest.",
      },
    ],
  },
  {
    category:"Tracking & Delivery",
    items:[
      {
        q:"How do I track my order?",
        a:"Log in to your dashboard at hire.iprojectmaster.com/login. You'll see each chapter's status in real time — from 'Assigned' through 'In Progress' to 'Delivered'. You'll also receive email notifications at every key stage.",
      },
      {
        q:"How will I know when my chapter is ready?",
        a:"You'll receive an email notification and see the chapter appear in your Downloads tab. You can download it directly from there.",
      },
      {
        q:"Can I communicate with my writer?",
        a:"You can send additional instructions or clarifications via our WhatsApp support line at +234 813 292 6373. Our team will relay your instructions to the writer.",
      },
      {
        q:"What happens if my chapter is delivered late?",
        a:"We take deadlines seriously. If your order is significantly delayed beyond our stated turnaround time and we are unable to deliver, you are entitled to a refund. Contact us via WhatsApp immediately if you have a deadline concern.",
      },
    ],
  },
  {
    category:"Privacy & Security",
    items:[
      {
        q:"Is my information kept confidential?",
        a:"Absolutely. Your name, project topic, and all personal details are strictly confidential. We do not share your information with any third party, including other students or institutions. Our writers sign confidentiality agreements.",
      },
      {
        q:"Will my school find out?",
        a:"We take every precaution to protect your privacy. We do not contact your institution, and we do not store or publish your project publicly. How you use the delivered work is entirely up to you.",
      },
      {
        q:"Is payment on your platform secure?",
        a:"Yes. All payments are processed by Paystack and Flutterwave — two of Africa's most trusted payment processors. We never see or store your card details.",
      },
    ],
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div style={{ minHeight:"100vh", background:"#F0F9FF", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
      <PublicNav />

      <div style={{ maxWidth:"720px", margin:"0 auto", padding:"3rem 1.5rem" }}>
        <div style={{ textAlign:"center", marginBottom:"3rem" }}>
          <div style={{ display:"inline-block", background:"#DBEAFE", color:"#1D4ED8", fontSize:".72rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", padding:".3rem .85rem", borderRadius:"999px", marginBottom:"1rem" }}>
            FAQ
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.75rem", fontWeight:800, color:"#0C1A2E", marginBottom:".5rem" }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize:".88rem", color:"#5B7EA6" }}>
            Can't find your answer? Chat with us on WhatsApp — we respond fast.
          </p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"2.5rem" }}>
          {faqs.map(cat => (
            <div key={cat.category}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:".9rem", fontWeight:800, color:"#0369A1", textTransform:"uppercase", letterSpacing:".08em", marginBottom:"1rem" }}>
                {cat.category}
              </h2>
              <div style={{ display:"flex", flexDirection:"column", gap:".6rem" }}>
                {cat.items.map(item => {
                  const key = `${cat.category}-${item.q}`;
                  const isOpen = open === key;
                  return (
                    <div key={key}
                      style={{ background:"#fff", border:`1.5px solid ${isOpen?"#38BDF8":"#E0F2FE"}`, borderRadius:"12px", overflow:"hidden", transition:"border-color .15s" }}>
                      <button
                        onClick={() => setOpen(isOpen ? null : key)}
                        style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"1rem 1.25rem", background:"none", border:"none", cursor:"pointer", textAlign:"left", gap:"1rem" }}>
                        <span style={{ fontWeight:700, fontSize:".85rem", color:"#0C1A2E", flex:1 }}>{item.q}</span>
                        <span style={{ fontSize:"1rem", color:"#38BDF8", flexShrink:0, transition:"transform .2s", transform: isOpen?"rotate(45deg)":"rotate(0)" }}>＋</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding:"0 1.25rem 1.1rem", fontSize:".83rem", color:"#475569", lineHeight:1.8, borderTop:"1px solid #F0F9FF" }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div style={{ background:"#0C1A2E", borderRadius:"16px", padding:"2rem", textAlign:"center", marginTop:"3rem" }}>
          <div style={{ fontSize:"1.5rem", marginBottom:".6rem" }}>💬</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1rem", fontWeight:800, color:"#fff", marginBottom:".6rem" }}>
            Still have questions?
          </h2>
          <p style={{ color:"#94A3B8", fontSize:".83rem", marginBottom:"1.25rem" }}>
            Our team is available on WhatsApp every day. We typically respond within minutes.
          </p>
          <a href="https://wa.me/2348132926373?text=Hi%20Lina%2C%20I%20have%20a%20question%20about%20iProjectMaster"
            style={{ display:"inline-block", padding:".75rem 1.75rem", borderRadius:"10px", background:"#25D366", color:"#fff", fontWeight:700, fontSize:".85rem", textDecoration:"none" }}>
            Chat on WhatsApp →
          </a>
        </div>
      </div>
    </div>
  );
}
