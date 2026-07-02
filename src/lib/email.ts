// src/lib/email.ts
// Email notification helper — Resend + branded HTML templates

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM   = process.env.EMAIL_FROM || "iProjectMaster <noreply@hire.iprojectmaster.com>";
const APP    = process.env.NEXT_PUBLIC_APP_URL || "https://iprojectmaster.com";

// ─────────────────────────────────────────
// SHARED HTML WRAPPER
// ─────────────────────────────────────────
function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #F0F9FF; margin: 0; padding: 20px; color: #0C1A2E; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(14,165,233,.1); }
    .header { background: #0C1A2E; padding: 24px 32px; }
    .logo { font-size: 1.2rem; font-weight: 800; color: #fff; letter-spacing: -.02em; }
    .logo span { color: #38BDF8; }
    .body { padding: 28px 32px; }
    .title { font-size: 1.1rem; font-weight: 700; color: #0C1A2E; margin-bottom: 12px; }
    .text { font-size: .88rem; color: #5B7EA6; line-height: 1.65; margin-bottom: 16px; }
    .btn { display: inline-block; background: #38BDF8; color: #0C1A2E; font-weight: 700; font-size: .85rem; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 8px; }
    .divider { height: 1px; background: #E0F2FE; margin: 20px 0; }
    .footer { padding: 16px 32px; background: #F0F9FF; font-size: .75rem; color: #94A3B8; }
    .highlight { background: #E0F2FE; border-radius: 8px; padding: 12px 16px; font-size: .85rem; color: #0284C7; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">iProject<span>Master</span></div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      This email was sent by iProjectMaster. If you did not expect this email, please ignore it.<br>
      © ${new Date().getFullYear()} iProjectMaster. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────
// SHARED: "Browse ready-made projects" note
// Framed as helpful info, not an ad — appears at the bottom of
// student-facing delivery/correction emails.
// ─────────────────────────────────────────
function browseProjectsNote(): string {
  return `
    <div class="divider"></div>
    <p class="text" style="font-size:.82rem;">
      Know someone working on their own project? iProjectMaster also has a library of
      <a href="https://www.iprojectmaster.com/" style="color:#0369A1;font-weight:700;text-decoration:none;">ready-made project topics</a>
      across hundreds of departments — a useful starting point for research direction and structure.
    </p>`;
}

// ─────────────────────────────────────────
// EMAIL TYPES
// ─────────────────────────────────────────

/** Student: chapter delivered to their dashboard */
export async function sendChapterDeliveredEmail(opts: {
  to: string; name: string; topic: string; chapterLabel: string; orderId: string; planName: string;
}) {
  const isBasic = opts.planName === "BASIC";
  const correctionSection = isBasic
    ? `<p class="text" style="font-size:.85rem;color:#9A3412;background:#FFF7ED;padding:.75rem 1rem;border-radius:8px;border-left:3px solid #F97316;margin-top:8px;">
        <strong>Note:</strong> Your current plan (Basic) does not include free corrections. If you need corrections, you can upgrade your plan by placing a new order.
       </p>`
    : `<p class="text" style="font-size:.85rem;">Need corrections? You can request them directly from your dashboard. Corrections are <strong>free</strong> on your current plan.</p>
       <a href="${APP}/student/corrections" class="btn" style="background:#F0F9FF;color:#0369A1;border:1.5px solid #38BDF8;margin-top:4px;">Request a Correction →</a>`;

  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `✅ ${opts.chapterLabel} is ready — ${opts.topic}`,
    html: wrap(`
      <div class="title">Your ${opts.chapterLabel} is Ready!</div>
      <p class="text">Hi ${opts.name}, great news! Your <strong>${opts.chapterLabel}</strong> for the project:</p>
      <div class="highlight">${opts.topic}</div>
      <p class="text">has been completed and is now available in your dashboard. Log in to download it.</p>
      <a href="${APP}/student/downloads" class="btn">⬇ Download My Chapter →</a>
      <div class="divider"></div>
      ${correctionSection}
      ${browseProjectsNote()}
    `),
  });
}

/** Student: correction has been resolved and sent back */
export async function sendCorrectionReadyEmail(opts: {
  to: string; name: string; topic: string; chapterLabel: string;
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `🔧 Correction Ready — ${opts.chapterLabel}`,
    html: wrap(`
      <div class="title">Your Correction is Ready</div>
      <p class="text">Hi ${opts.name}, your requested correction for <strong>${opts.chapterLabel}</strong> on:</p>
      <div class="highlight">${opts.topic}</div>
      <p class="text">has been completed. The corrected version is now available in your Downloads.</p>
      <a href="${APP}/student/dashboard" class="btn">Download Corrected Chapter →</a>
      ${browseProjectsNote()}
    `),
  });
}

/** Legacy client: account created when admin lodges a correction — send credentials */
export async function sendLegacyAccountCreatedEmail(opts: {
  to: string; name: string; tempPassword: string; topic: string;
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `Your iProjectMaster account is ready — ${opts.topic.slice(0,50)}`,
    html: wrap(`
      <div class="title">Your Correction is Being Processed</div>
      <p class="text">Hi ${opts.name}, we've received your correction request for:</p>
      <div class="highlight">${opts.topic}</div>
      <p class="text">Our QC team is working on it. We'll email you directly with your corrected file once it's ready — no action needed from you right now.</p>
      <div class="divider"></div>
      <p class="text" style="font-size:.82rem;">We've also created an account for you so you can track progress and download your work at any time:</p>
      <table style="width:100%;font-size:.82rem;border-collapse:collapse;margin:.75rem 0;background:#F8FCFF;border-radius:8px;padding:.75rem;">
        <tr><td style="padding:.4rem .75rem;color:#5B7EA6;width:120px;">Login Email</td><td style="padding:.4rem .75rem;font-weight:700;">${opts.to}</td></tr>
        <tr><td style="padding:.4rem .75rem;color:#5B7EA6;">Password</td><td style="padding:.4rem .75rem;font-weight:700;font-family:monospace;">${opts.tempPassword}</td></tr>
      </table>
      <a href="${APP}/login" class="btn" style="background:#F0F9FF;color:#0369A1;border:1.5px solid #38BDF8;">Login to Dashboard →</a>
      <p class="text" style="font-size:.75rem;color:#5B7EA6;margin-top:.75rem;">Please change your password after logging in. If you did not request this, please ignore this email.</p>
    `),
  });
}

/** Legacy client: QC has delivered — send file link directly so they don't need to log in */
export async function sendLegacyCorrectionDeliveredEmail(opts: {
  to: string; name: string; topic: string; chapterLabel: string; fileUrl: string;
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `✅ Your corrected work is ready — ${opts.topic.slice(0,60)}`,
    html: wrap(`
      <div class="title">Your Correction is Ready!</div>
      <p class="text">Hi ${opts.name}, great news! The correction for <strong>${opts.chapterLabel}</strong> on:</p>
      <div class="highlight">${opts.topic}</div>
      <p class="text">has been completed. Click the button below to download your corrected work directly:</p>
      <a href="${opts.fileUrl}" class="btn">⬇ Download Corrected Work →</a>
      <div class="divider"></div>
      <p class="text" style="font-size:.82rem;">You can also log in to your dashboard at any time to access all your files:</p>
      <a href="${APP}/student/downloads" class="btn" style="background:#F0F9FF;color:#0369A1;border:1.5px solid #38BDF8;font-size:.82rem;">Go to My Downloads →</a>
      ${browseProjectsNote()}
    `),
  });
}

export async function sendJobAssignedEmail(opts: {
  to: string; name: string; role: string; topic: string; chapterLabel: string; department?: string;
}) {
  const dashLink = opts.role === "ANALYST" ? `${APP}/analyst/jobs/pending`
                 : opts.role === "QC"      ? `${APP}/qc/checks/pending`
                 : `${APP}/writer/jobs/pending`;
  const roleLabel = opts.role === "ANALYST" ? "Analyst" : opts.role === "QC" ? "QC" : "Writer";
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `📋 New Job Assigned — ${opts.chapterLabel}`,
    html: wrap(`
      <div class="title">New Job Assigned to You</div>
      <p class="text">Hi ${opts.name}, a new <strong>${opts.chapterLabel}</strong> job has been assigned to you${opts.department ? ` (${opts.department})` : ""}:</p>
      <div class="highlight">${opts.topic}</div>
      <p class="text">Log in to your <strong>${roleLabel}</strong> dashboard to review the student's instructions and start working. Remember your deadline is <strong>3 working days</strong> from when you start the job.</p>
      <a href="${dashLink}" class="btn">View Pending Jobs →</a>
    `),
  });
}

/** Analyst: writer has submitted Chapter 1 prelim fields */
export async function sendPrelimReadyEmail(opts: {
  to: string; name: string; topic: string;
  researchObjectives: string;
  hypotheses: string; scopeOfStudy: string;
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `📝 Chapter 1 Preliminary Notes Ready — ${opts.topic}`,
    html: wrap(`
      <div class="title">Writer's Preliminary Notes are Ready</div>
      <p class="text">Hi ${opts.name}, the writer has submitted the Chapter 1 preliminary fields for:</p>
      <div class="highlight">${opts.topic}</div>
      <p class="text">Here are the details you need to work on Chapters 3 & 4:</p>
      <p class="text"><strong>Research Objectives:</strong><br>${opts.researchObjectives}</p>
      <p class="text"><strong>Hypotheses:</strong><br>${opts.hypotheses}</p>
      <p class="text"><strong>Scope of Study:</strong><br>${opts.scopeOfStudy}</p>
      <a href="${APP}/analyst/jobs/active" class="btn">View My Active Jobs →</a>
    `),
  });
}

/** Staff: withdrawal approved and paid */
export async function sendWithdrawalPaidEmail(opts: {
  to: string; name: string; amountNaira: number; bankName: string;
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `💰 Withdrawal of ₦${opts.amountNaira.toLocaleString()} Paid`,
    html: wrap(`
      <div class="title">Your Withdrawal Has Been Processed</div>
      <p class="text">Hi ${opts.name}, your withdrawal request has been approved and <strong>₦${opts.amountNaira.toLocaleString()}</strong> has been sent to your <strong>${opts.bankName}</strong> account via Paystack.</p>
      <p class="text">This may take a few minutes to reflect in your bank account depending on your bank.</p>
      <a href="${APP}/writer/withdraw" class="btn">View Earnings →</a>
    `),
  });
}

/** Staff: account approved by admin */
export async function sendAccountApprovedEmail(opts: {
  to: string; name: string; role: string;
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `✅ Your ${opts.role} Account Has Been Approved`,
    html: wrap(`
      <div class="title">Welcome to iProjectMaster!</div>
      <p class="text">Hi ${opts.name}, your <strong>${opts.role}</strong> account has been reviewed and approved by our admin team.</p>
      <p class="text">You can now log in and start accepting jobs. Jobs will be automatically assigned to you based on your availability.</p>
      <a href="${APP}/login" class="btn">Log In Now →</a>
    `),
  });
}

/** Staff: account declined by admin */
export async function sendAccountDeclinedEmail(opts: {
  to: string; name: string; role: string; reason?: string;
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `Your ${opts.role} Application — Update`,
    html: wrap(`
      <div class="title">Application Update</div>
      <p class="text">Hi ${opts.name}, we have reviewed your application to join iProjectMaster as a <strong>${opts.role}</strong>.</p>
      ${opts.reason ? `<div class="highlight"><strong>Reason:</strong> ${opts.reason}</div>` : ""}
      <p class="text">Unfortunately, we are unable to approve your application at this time. You are welcome to apply again in the future with an updated CV and work sample.</p>
      <p class="text">If you have any questions, please contact us at support@iprojectmaster.com.</p>
    `),
  });
}

/** QC: chapter routed for check */
export async function sendQCCheckAssignedEmail(opts: {
  to: string; name: string; topic: string; chapterLabel: string; checks: string[];
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `🔍 QC Check Required — ${opts.chapterLabel}`,
    html: wrap(`
      <div class="title">QC Check Assigned</div>
      <p class="text">Hi ${opts.name}, a new chapter requires quality control checks:</p>
      <div class="highlight"><strong>${opts.chapterLabel}</strong> — ${opts.topic}<br>Checks required: <strong>${opts.checks.join(", ")}</strong></div>
      <p class="text">Please log in to your dashboard to download the file and run the required checks.</p>
      <a href="${APP}/qc/checks/pending" class="btn">View Pending Checks →</a>
    `),
  });
}

/** Admin: new staff registration pending review */
export async function sendNewStaffRegistrationEmail(opts: {
  to: string; staffName: string; staffRole: string;
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `👤 New ${opts.staffRole} Application — ${opts.staffName}`,
    html: wrap(`
      <div class="title">New Staff Application</div>
      <p class="text"><strong>${opts.staffName}</strong> has applied to join iProjectMaster as a <strong>${opts.staffRole}</strong>.</p>
      <p class="text">Please log in to the admin panel to review their CV and work sample, then approve or decline their application.</p>
      <a href="${APP}/admin/staff" class="btn">Review Application →</a>
    `),
  });
}
