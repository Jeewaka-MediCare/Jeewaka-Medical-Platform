// Optional: small helper to prevent HTML injection in admin comments
const escapeHtml = (s = "") =>
  s.replace(/[&<>"'`=\/]/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;", "/": "&#x2F;",
    "`": "&#x60;", "=": "&#x3D;"
  }[c]));

/**
 * Doctor Verification Result Email
 * @param {Object} opts
 * @param {string} opts.doctorName - Full name of the doctor (e.g., "Dr. Nimal Perera")
 * @param {boolean} opts.isVerified - true = approved, false = rejected
 * @param {string} [opts.adminComments] - Reviewer/admin comments (optional)
 * @param {string} [opts.dashboardUrl] - Link to doctor dashboard (shown when approved)
 * @param {string} [opts.resubmitUrl]  - Link to fix/resubmit verification (shown when rejected)
 * @returns {string} HTML email
 */
export const doctorVerificationEmail = ({
  doctorName,
  isVerified,
  adminComments = "",
  dashboardUrl = "#",
  resubmitUrl = "#",
}) => {
  const year = new Date().getFullYear();
  const safeComments = escapeHtml(adminComments.trim());

  const headerTitle = isVerified ? "Verification Successful" : "Verification Not Approved";
  const statusBadge = isVerified ? "Approved" : "Rejected";
  const statusColor = isVerified ? "#1cc88a" : "#e74a3b";
  const leadLine = isVerified
    ? `🎉 Great news! Your profile has been successfully verified.`
    : `We’ve reviewed your documents, but we couldn’t approve your verification at this time.`;
  const nextLine = isVerified
    ? `You’re now listed as a <strong>Verified Doctor</strong>. You can accept appointments and manage your availability.`
    : `Please review the notes below and update your submission. You can resubmit once the issues are addressed.`;
  const ctaText = isVerified ? "Go to Dashboard" : "Review & Resubmit";
  const ctaLink = isVerified ? dashboardUrl : resubmitUrl;

  const commentsBlock = safeComments
    ? `
      <div style="margin-top:18px;padding:14px 16px;border-left:4px solid ${statusColor};background:#f8fafc;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;color:#111">Admin notes</div>
        <div style="color:#333;line-height:1.6;">${safeComments.replace(/\n/g, "<br/>")}</div>
      </div>
    `
    : "";

  const tipsBlock = isVerified
    ? `
      <ul style="margin:18px 0 0 18px;padding:0;color:#333;line-height:1.6;">
        <li>Complete your profile (specialties, qualifications, clinics).</li>
        <li>Set your availability and consultation fees.</li>
        <li>Enable notifications to never miss a booking.</li>
      </ul>
    `
    : `
      <ul style="margin:18px 0 0 18px;padding:0;color:#333;line-height:1.6;">
        <li>Ensure documents are clear, valid, and up-to-date.</li>
        <li>Match your name on documents with your profile name.</li>
        <li>Include any required council/registration numbers.</li>
      </ul>
    `;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Doctor Verification Update</title>
    <style>
      /* Keep styling similar to your registration email */
      body { font-family: 'Segoe UI', sans-serif; background-color: #f6f9fc; margin:0; padding:0; }
      .container { max-width:600px; background:#ffffff; margin:40px auto; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); overflow:hidden; }
      .header { background: linear-gradient(135deg, #4e73df, #1cc88a); color:#fff; text-align:center; padding:30px 20px; position:relative; }
      .header h1 { margin:0; font-size:26px; }
      .badge { display:inline-block; margin-top:10px; padding:6px 12px; background:${statusColor}; color:#fff; border-radius:999px; font-weight:600; font-size:13px; }
      .content { padding:30px; color:#333; line-height:1.6; }
      .content h2 { color:#1cc88a; font-size:22px; margin-top:0; }
      .button { display:inline-block; margin-top:25px; padding:12px 24px; background-color:#4e73df; color:#fff !important; text-decoration:none; border-radius:6px; font-weight:bold; transition: background 0.3s; }
      .button:hover { background-color:#375ac3; }
      .footer { text-align:center; font-size:13px; color:#777; padding:15px; background:#f1f3f6; }
      .muted { color:#555; }
      @media (prefers-color-scheme: dark) {
        body { background:#0b0e12; }
        .container { background:#0e141b; box-shadow:0 4px 12px rgba(0,0,0,0.6); }
        .content, .muted { color:#d2d7de; }
        .footer { background:#0b1117; color:#9aa4b2; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Doctor Verification Update</h1>
        <span class="badge">${statusBadge}</span>
      </div>
      <div class="content">
        <h2>Dear ${doctorName || "Doctor"},</h2>
        <p class="muted">${leadLine}</p>
        <p>${nextLine}</p>
        ${commentsBlock}
        ${tipsBlock}
        <a class="button" href="${ctaLink}" target="_blank" rel="noopener noreferrer">${ctaText}</a>
        <p style="margin-top:22px;color:#555;">If you believe this decision was made in error or you need help, reply to this email and our team will assist you.</p>
        <p>Warm regards,<br/><strong>The HealthCare Team</strong></p>
      </div>
      <div class="footer">
        © Jeewaka ${year} HealthCare Platform. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};
