// Optional: same helper you used to prevent HTML injection
export const escapeHtml = (s = "") =>
  s.replace(/[&<>"'`=\/]/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;", "/": "&#x2F;",
    "`": "&#x60;", "=": "&#x3D;"
  }[c]));

/**
 * Doctor Session Initialized Email (to Doctor)
 * @param {Object} opts
 * @param {string} opts.doctorName            - e.g. "Dr. Nimal Perera"
 * @param {string|Date} opts.sessionDate      - ISO string or Date
 * @param {"online"|"in-person"} opts.type    - session type
 * @param {string} [opts.hospitalName]        - if in-person
 * @param {string} [opts.hospitalAddress]     - if in-person
 * @param {string} [opts.meetingLink]         - if online
 * @param {Array<{startTime:string,endTime:string,status?:string}>} [opts.timeSlots] - optional slot list
 * @param {string} [opts.manageUrl]           - link to manage session in dashboard
 * @param {string} [opts.calendarIcsUrl]      - optional .ics link
 * @param {string} [opts.supportEmail]        - support contact
 * @returns {string} HTML email
 */
export const sessionInitializedEmail = ({
  doctorName,
  sessionDate,
  type,
  hospitalName = "",
  hospitalAddress = "",
  meetingLink = "",
  timeSlots = [],
  manageUrl = "#",
  calendarIcsUrl = "",
  supportEmail = "support@healthcare.example",
}) => {
  const year = new Date().getFullYear();

  // Format date/time in Asia/Colombo (user’s TZ)
  const dateObj = sessionDate instanceof Date ? sessionDate : new Date(sessionDate);
  const fmtOpts = { timeZone: "Asia/Colombo", year: "numeric", month: "long", day: "numeric" };
  const fmtTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit", hour12: true });

  const dateStr = new Intl.DateTimeFormat("en-GB", fmtOpts).format(dateObj);
  const timeRangeStr = (() => {
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) return "";
    // Show a compact preview of the first 3 time slots
    const preview = timeSlots.slice(0, 3).map(s => `${escapeHtml(s.startTime)} – ${escapeHtml(s.endTime)}`).join(", ");
    const extra = timeSlots.length > 3 ? ` +${timeSlots.length - 3} more` : "";
    return `${preview}${extra}`;
  })();

  const isOnline = String(type).toLowerCase() === "online";

  const detailsBlock = isOnline
    ? `
      <div style="margin-top:18px;padding:14px 16px;border-left:4px solid #4e73df;background:#f8fafc;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;color:#111">Online session details</div>
        <div style="color:#333;line-height:1.6;">
          <div><strong>Date:</strong> ${dateStr}</div>
          ${timeRangeStr ? `<div><strong>Time slots:</strong> ${timeRangeStr} <span style="color:#6b7280">(Asia/Colombo)</span></div>` : ""}
          ${meetingLink ? `<div><strong>Meeting link:</strong> <a href="${escapeHtml(meetingLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(meetingLink)}</a></div>` : ""}
        </div>
      </div>
    `
    : `
      <div style="margin-top:18px;padding:14px 16px;border-left:4px solid #1cc88a;background:#f8fafc;border-radius:8px;">
        <div style="font-weight:600;margin-bottom:6px;color:#111">In-person session details</div>
        <div style="color:#333;line-height:1.6;">
          <div><strong>Date:</strong> ${dateStr}</div>
          ${timeRangeStr ? `<div><strong>Time slots:</strong> ${timeRangeStr} <span style="color:#6b7280">(Asia/Colombo)</span></div>` : ""}
          ${hospitalName ? `<div><strong>Hospital/Clinic:</strong> ${escapeHtml(hospitalName)}</div>` : ""}
          ${hospitalAddress ? `<div><strong>Address:</strong> ${escapeHtml(hospitalAddress)}</div>` : ""}
        </div>
      </div>
    `;

  const tipsBlock = `
    <ul style="margin:18px 0 0 18px;padding:0;color:#333;line-height:1.6;">
      <li>Review and adjust availability if needed.</li>
      <li>Enable notifications to stay updated on bookings.</li>
      <li>Double-check pricing and cancellation policies.</li>
    </ul>
  `;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Session Initialized</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; background-color: #f6f9fc; margin:0; padding:0; }
      .container { max-width:600px; background:#ffffff; margin:40px auto; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); overflow:hidden; }
      .header { background: linear-gradient(135deg, #4e73df, #1cc88a); color:#fff; text-align:center; padding:30px 20px; }
      .header h1 { margin:0; font-size:24px; }
      .badge { display:inline-block; margin-top:10px; padding:6px 12px; background:#111827; color:#fff; border-radius:999px; font-weight:600; font-size:12px; }
      .content { padding:30px; color:#333; line-height:1.6; }
      .content h2 { color:#111; font-size:20px; margin-top:0; }
      .button { display:inline-block; margin-top:22px; padding:12px 18px; background-color:#4e73df; color:#fff !important; text-decoration:none; border-radius:6px; font-weight:600; }
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
        <h1>Session Initialized</h1>
        <span class="badge">${isOnline ? "Online" : "In-person"}</span>
      </div>
      <div class="content">
        <h2>Dear ${escapeHtml(doctorName || "Doctor")},</h2>
        <p class="muted">Your new ${isOnline ? "online" : "in-person"} consultation session has been created.</p>
        ${detailsBlock}
        ${tipsBlock}
        <div style="margin-top:22px;">
          <a class="button" href="${escapeHtml(manageUrl)}" target="_blank" rel="noopener noreferrer">Manage Session</a>
          ${calendarIcsUrl ? `&nbsp;&nbsp;<a class="button" href="${escapeHtml(calendarIcsUrl)}" target="_blank" rel="noopener noreferrer">Add to Calendar</a>` : ""}
        </div>
        <p style="margin-top:22px;color:#555;">Need help? Contact us at <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a>.</p>
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
