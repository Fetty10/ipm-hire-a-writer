"use client";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";

const sections = [
  {
    title:"1. Nature of Service",
    body:`iProjectMaster provides custom academic writing assistance to students. All work produced by our writers is original, written specifically for each client based on their instructions, and intended for use as a reference, study guide, or model for the client's own learning and development.

By placing an order on this platform, you confirm that you understand the nature of this service and agree to use the delivered work in accordance with your institution's academic policies.`,
  },
  {
    title:"2. Who Can Use This Service",
    body:`This service is available to students registered at recognised educational institutions in Nigeria and internationally. You must be at least 16 years old to place an order. By registering an account, you confirm that the information you provide — including your name, email address, and WhatsApp number — is accurate and belongs to you.`,
  },
  {
    title:"3. Orders and Payment",
    body:`An order is confirmed once payment has been received and verified. For Paystack and Flutterwave payments, confirmation is automatic. For bank transfers, confirmation occurs after our team verifies the transfer against your unique reference number.

All prices are displayed in Nigerian Naira (₦) for Nigerian students and in the applicable local currency for international students. Prices are as listed on our pricing page and are subject to change at any time without prior notice, though changes will not affect orders already confirmed.`,
  },
  {
    title:"4. Delivery and Timelines",
    body:`Chapter delivery timelines depend on the degree level, service type, and current writer workload. Standard turnaround times are communicated during the ordering process. iProjectMaster is not liable for delays caused by circumstances beyond our control, including but not limited to power outages, internet failure, or illness.

You will be notified via email and your dashboard when each chapter is delivered. It is your responsibility to check your account regularly.`,
  },
  {
    title:"5. Corrections and Revisions",
    body:`Corrections are included in the Standard and Professional plans. If your supervisor provides feedback or corrections on a delivered chapter, our QC team will handle the revisions at no additional cost, provided:

• The correction request is based on the original brief — not a change of scope
• The chapter was written according to the instructions you provided at the time of order
• The correction request is submitted within a reasonable time after delivery

We do not offer revisions on the Basic plan. Corrections on other services (seminar, proposal, journal, etc.) are not included unless explicitly stated.`,
  },
  {
    title:"6. Confidentiality",
    body:`iProjectMaster treats all client information and project details with strict confidentiality. We do not share, sell, or disclose your personal data or project content to any third party, including other students, institutions, or external organisations.

Our writers and quality control staff are bound by confidentiality agreements. Your project topic, content, and identity will not be disclosed to anyone outside our internal team.`,
  },
  {
    title:"7. Refund Policy",
    body:`We offer refunds in the following circumstances:

• We are unable to assign a writer to your order within 48 hours of confirmed payment
• A delivered chapter is demonstrably not in line with the instructions you provided, and our team is unable to correct it after two revision attempts

Refunds are not offered in the following circumstances:

• You change your mind after an order has been assigned to a writer
• You provide incorrect or insufficient instructions and the work is delivered accordingly
• You have already downloaded the delivered files
• The delay is caused by your own failure to respond to queries from our team

Refund requests must be submitted via WhatsApp within 7 days of the event giving rise to the claim.`,
  },
  {
    title:"8. Your Responsibilities",
    body:`You are responsible for:

• Providing clear, accurate, and complete instructions at the time of order
• Checking your dashboard and email regularly for updates and delivered files
• Downloading your files promptly — we cannot guarantee indefinite storage of delivered work
• Using the delivered work responsibly and in accordance with your institution's guidelines`,
  },
  {
    title:"9. Intellectual Property",
    body:`All work produced by iProjectMaster writers is commissioned specifically for you. Upon full payment, you receive full rights to use the delivered content. iProjectMaster retains no ongoing rights to the work after delivery.

You may not resell, redistribute, or publish the delivered work as-is for commercial purposes.`,
  },
  {
    title:"10. Limitation of Liability",
    body:`iProjectMaster is not responsible for any academic consequences arising from your use of our services, including but not limited to disciplinary action by your institution. It is your responsibility to understand your institution's policies on academic assistance and to use our services appropriately.

Our total liability to you in any circumstances shall not exceed the amount you paid for the specific order in question.`,
  },
  {
    title:"11. Changes to These Terms",
    body:`We may update these Terms of Use at any time. Continued use of our services after any changes constitutes acceptance of the updated terms. We recommend checking this page periodically.`,
  },
  {
    title:"12. Contact",
    body:`For questions about these terms, reach us via WhatsApp at +234 813 292 6373 or email support@iprojectmaster.com.`,
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight:"100vh", background:"#F0F9FF", fontFamily:"'DM Sans',sans-serif" }}>
      {/* Header */}
      <PublicNav />

      <div style={{ maxWidth:"720px", margin:"0 auto", padding:"3rem 1.5rem" }}>
        <div style={{ marginBottom:"2.5rem" }}>
          <div style={{ display:"inline-block", background:"#DBEAFE", color:"#1D4ED8", fontSize:".72rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", padding:".3rem .85rem", borderRadius:"999px", marginBottom:"1rem" }}>
            Legal
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"1.75rem", fontWeight:800, color:"#0C1A2E", marginBottom:".5rem" }}>
            Terms of Use
          </h1>
          <p style={{ fontSize:".82rem", color:"#5B7EA6" }}>
            Last updated: July 2026. These terms govern your use of the iProjectMaster Hire a Writer platform at hire.iprojectmaster.com.
          </p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          {sections.map(s => (
            <div key={s.title} style={{ background:"#fff", border:"1.5px solid #E0F2FE", borderRadius:"14px", padding:"1.5rem" }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:".95rem", fontWeight:800, color:"#0C1A2E", marginBottom:".75rem" }}>{s.title}</h2>
              <div style={{ fontSize:".83rem", color:"#475569", lineHeight:1.9, whiteSpace:"pre-line" }}>{s.body}</div>
            </div>
          ))}
        </div>

        <div style={{ background:"#0C1A2E", borderRadius:"16px", padding:"1.5rem", textAlign:"center", marginTop:"2rem" }}>
          <p style={{ color:"#94A3B8", fontSize:".83rem", marginBottom:"1rem" }}>
            By using iProjectMaster, you agree to these terms. Questions? We're always available.
          </p>
          <a href="https://wa.me/2348132926373"
            style={{ display:"inline-block", padding:".7rem 1.5rem", borderRadius:"10px", background:"#25D366", color:"#fff", fontWeight:700, fontSize:".83rem", textDecoration:"none" }}>
            💬 Chat with Us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
