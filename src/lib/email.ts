// src/lib/email.ts
// Email notification helper — Resend + branded HTML templates

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM   = process.env.EMAIL_FROM || "iProjectMaster <noreply@iprojectmaster.com>";
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
// EMAIL TYPES
// ─────────────────────────────────────────

/** Student: chapter delivered to their dashboard */
export async function sendChapterDeliveredEmail(opts: {
  to: string; name: string; topic: string; chapterLabel: string; orderId: string;
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `✅ ${opts.chapterLabel} is ready — ${opts.topic}`,
    html: wrap(`
      <div class="title">Your ${opts.chapterLabel} is Ready!</div>
      <p class="text">Hi ${opts.name}, great news! Your <strong>${opts.chapterLabel}</strong> for the project:</p>
      <div class="highlight">${opts.topic}</div>
      <p class="text">has been completed and is now available in your dashboard. Log in to download it.</p>
      <a href="${APP}/student/dashboard" class="btn">Go to My Dashboard →</a>
      <div class="divider"></div>
      <p class="text" style="font-size:.8rem">If you have corrections, you can request them directly from your dashboard under <strong>Request Correction</strong>.</p>
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
    `),
  });
}

/** Staff: new job assigned */
export async function sendJobAssignedEmail(opts: {
  to: string; name: string; role: string; topic: string; chapterLabel: string;
}) {
  await resend.emails.send({
    from: FROM, to: opts.to,
    subject: `📋 New ${opts.role} Job — ${opts.chapterLabel}`,
    html: wrap(`
      <div class="title">New Job Assigned to You</div>
      <p class="text">Hi ${opts.name}, a new <strong>${opts.chapterLabel}</strong> job has been assigned to you for the topic:</p>
      <div class="highlight">${opts.topic}</div>
      <p class="text">Please log in to your dashboard to review the student's instructions and start working on it.</p>
      <a href="${APP}/writer/dashboard" class="btn">View My Jobs →</a>
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
      <a href="${APP}/staff/login" class="btn">Log In to Staff Portal →</a>
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
      <a href="${APP}/qc/dashboard" class="btn">View QC Jobs →</a>
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
