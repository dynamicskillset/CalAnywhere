/**
 * Email sending service.
 *
 * Uses Mailgun when configured (MAILGUN_API_KEY, MAILGUN_DOMAIN,
 * MAILGUN_FROM_EMAIL). Falls back to a console stub in development
 * when env vars are absent — no noisy warnings, just a one-time log.
 */

import axios from "axios";

interface AppointmentEmailPayload {
  ownerName: string;
  ownerEmail: string;
  requesterName: string;
  requesterEmail: string;
  reason: string;
  notes?: string;
  startIso: string;
  endIso: string;
  timezone?: string;
}

interface VerificationEmailPayload {
  requesterEmail: string;
  requesterName: string;
  ownerName: string;
  startIso: string;
  endIso: string;
  confirmUrl: string;
  timezone?: string;
}

// ── Mailgun config (optional) ─────────────────────────────────────

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL;
const MAILGUN_API_BASE =
  process.env.MAILGUN_API_BASE || "https://api.eu.mailgun.net";

const isMailgunConfigured = !!(
  MAILGUN_API_KEY &&
  MAILGUN_DOMAIN &&
  MAILGUN_FROM_EMAIL
);

if (!isMailgunConfigured) {
  // eslint-disable-next-line no-console
  console.log(
    "[email] Mailgun not configured. Emails will be logged to console. " +
      "Set MAILGUN_API_KEY, MAILGUN_DOMAIN, and MAILGUN_FROM_EMAIL to enable."
  );
}

// ── Time formatting helpers ───────────────────────────────────────

/**
 * Format a Date in a given IANA timezone, e.g. "Monday 15 January 2024 at 15:00 CET"
 * Falls back to UTC if the timezone is invalid or unsupported.
 */
function formatInTimezone(date: Date, timezone: string): string {
  try {
    return date.toLocaleString("en-GB", {
      timeZone: timezone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return formatUtc(date);
  }
}

function formatUtc(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatTimeOnly(date: Date, timezone?: string): string {
  try {
    return date.toLocaleTimeString("en-GB", {
      timeZone: timezone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return date.toLocaleTimeString("en-GB", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }
}

function formatDateOnly(date: Date, timezone?: string): string {
  try {
    return date.toLocaleDateString("en-GB", {
      timeZone: timezone || "UTC",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date.toLocaleDateString("en-GB", {
      timeZone: "UTC",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

// ── HTML email template ───────────────────────────────────────────

function wrapHtml(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#ECEFF4;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ECEFF4;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#2E3440;border-radius:8px 8px 0 0;padding:20px 32px;">
              <p style="margin:0;color:#88C0D0;font-size:16px;font-weight:700;letter-spacing:0.02em;">CalAnywhere</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#E5E9F0;border-radius:0 0 8px 8px;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.5;">
                Sent via <strong>CalAnywhere</strong> &mdash; no calendar event has been created automatically.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function sectionHeading(text: string): string {
  return `<p style="margin:24px 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9E9E9E;">${text}</p>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 0;font-size:13px;color:#6B7280;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:4px 0;font-size:13px;color:#2E3440;font-weight:500;">${value}</td>
  </tr>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Low-level send ────────────────────────────────────────────────

async function sendViaMailgun(
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<void> {
  const auth = Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64");
  const form = new URLSearchParams();
  form.append("from", MAILGUN_FROM_EMAIL!);
  form.append("to", to);
  form.append("subject", subject);
  form.append("text", text);
  form.append("html", html);

  const url = `${MAILGUN_API_BASE}/v3/${MAILGUN_DOMAIN}/messages`;

  try {
    await axios.post(url, form, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 10000,
    });
  } catch (err: unknown) {
    const message =
      axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : String(err);
    // eslint-disable-next-line no-console
    console.error(`[email] Mailgun error: ${message}`);
    throw new Error(`Email send failed: ${message}`);
  }
}

// ── Public API ────────────────────────────────────────────────────

export async function sendVerificationEmail(
  payload: VerificationEmailPayload
): Promise<void> {
  const start = new Date(payload.startIso);
  const end = new Date(payload.endIso);
  const tz = payload.timezone;

  const dateLabel = formatDateOnly(start, tz);
  const timeLabel = `${formatTimeOnly(start, tz)} – ${formatTimeOnly(end, tz)}`;
  const utcLabel = tz
    ? `${formatTimeOnly(start, "UTC")} – ${formatTimeOnly(end, "UTC")} UTC`
    : null;

  const subject = `Confirm your appointment request with ${payload.ownerName}`;

  // Plain text
  const text = [
    `Hi ${payload.requesterName},`,
    ``,
    `Please confirm your appointment request by clicking the link below:`,
    ``,
    payload.confirmUrl,
    ``,
    `REQUEST DETAILS`,
    `  With:  ${payload.ownerName}`,
    `  Date:  ${dateLabel}`,
    `  Time:  ${timeLabel}`,
    utcLabel ? `         (${utcLabel})` : "",
    ``,
    `This link expires in 1 hour. If you did not make this request, you can safely ignore this email.`,
    ``,
    `-- CalAnywhere`,
  ].filter((l) => l !== null).join("\n");

  // HTML
  const bodyHtml = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2E3440;">Confirm your request</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#4C566A;line-height:1.6;">
      Hi ${escapeHtml(payload.requesterName)}, you requested an appointment with <strong>${escapeHtml(payload.ownerName)}</strong>.
      Please confirm below to send your request.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;background-color:#F8F9FB;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <tbody>
        ${infoRow("With", escapeHtml(payload.ownerName))}
        ${infoRow("Date", escapeHtml(dateLabel))}
        ${infoRow("Time", escapeHtml(timeLabel))}
        ${utcLabel ? infoRow("UTC reference", escapeHtml(utcLabel)) : ""}
      </tbody>
    </table>

    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${escapeHtml(payload.confirmUrl)}"
             style="display:inline-block;background-color:#5E81AC;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:6px;">
            Confirm appointment request
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:12px;color:#9E9E9E;line-height:1.5;">
      This link expires in 1 hour and can only be used once.
      If you did not make this request, you can safely ignore this email.
    </p>
  `;

  const html = wrapHtml(subject, bodyHtml);

  if (isMailgunConfigured) {
    await sendViaMailgun(payload.requesterEmail, subject, text, html);
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `[email stub] Verification for ${payload.requesterEmail}:`,
      payload.confirmUrl
    );
  }
}

export async function sendAppointmentRequestEmail(
  payload: AppointmentEmailPayload
): Promise<void> {
  const start = new Date(payload.startIso);
  const end = new Date(payload.endIso);
  const tz = payload.timezone;

  const dateLabel = formatDateOnly(start, tz);
  const timeLabel = `${formatTimeOnly(start, tz)} – ${formatTimeOnly(end, tz)}`;
  const utcLabel = tz
    ? `${formatTimeOnly(start, "UTC")} – ${formatTimeOnly(end, "UTC")} UTC`
    : null;
  const tzNote = tz ? ` (${tz})` : "";

  const subject = `Appointment request from ${payload.requesterName}: ${dateLabel}`;

  // Plain text
  const text = [
    `You have a new appointment request via CalAnywhere.`,
    ``,
    `REQUESTER`,
    `  Name:   ${payload.requesterName}`,
    `  Email:  ${payload.requesterEmail}`,
    ``,
    `REQUESTED TIME${tzNote}`,
    `  Date:  ${dateLabel}`,
    `  Time:  ${timeLabel}`,
    utcLabel ? `         (${utcLabel})` : "",
    ``,
    `REASON FOR MEETING`,
    payload.reason,
    ``,
    payload.notes ? `ADDITIONAL NOTES\n${payload.notes}\n` : "",
    `NEXT STEPS`,
    `  1. Check the time is still available in your calendar.`,
    `  2. Create an event for the agreed slot.`,
    `  3. Reply to ${payload.requesterEmail} to confirm or suggest alternatives.`,
    ``,
    `-- CalAnywhere`,
  ].filter((l) => l !== null).join("\n");

  // HTML
  const bodyHtml = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#2E3440;">New appointment request</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#4C566A;line-height:1.6;">
      <strong>${escapeHtml(payload.requesterName)}</strong> wants to meet with you.
    </p>

    ${sectionHeading("Requested time")}
    <table cellpadding="0" cellspacing="0" style="width:100%;background-color:#EBF4FF;border-left:3px solid #5E81AC;border-radius:0 6px 6px 0;padding:14px 20px;margin-bottom:4px;">
      <tbody>
        ${infoRow("Date", escapeHtml(dateLabel))}
        ${infoRow("Time", escapeHtml(timeLabel))}
        ${utcLabel ? infoRow("UTC reference", escapeHtml(utcLabel)) : ""}
      </tbody>
    </table>

    ${sectionHeading("From")}
    <table cellpadding="0" cellspacing="0" style="width:100%;background-color:#F8F9FB;border-radius:6px;padding:14px 20px;margin-bottom:4px;">
      <tbody>
        ${infoRow("Name", escapeHtml(payload.requesterName))}
        ${infoRow("Email", `<a href="mailto:${escapeHtml(payload.requesterEmail)}" style="color:#5E81AC;">${escapeHtml(payload.requesterEmail)}</a>`)}
      </tbody>
    </table>

    ${sectionHeading("Reason for meeting")}
    <p style="margin:0 0 16px;font-size:14px;color:#2E3440;line-height:1.6;white-space:pre-wrap;">${escapeHtml(payload.reason)}</p>

    ${payload.notes ? `
    ${sectionHeading("Additional notes")}
    <p style="margin:0 0 16px;font-size:14px;color:#4C566A;line-height:1.6;white-space:pre-wrap;">${escapeHtml(payload.notes)}</p>
    ` : ""}

    ${sectionHeading("Next steps")}
    <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#4C566A;line-height:2;">
      <li>Check the time is still available in your calendar.</li>
      <li>Create an event for the agreed slot.</li>
      <li>Reply to <a href="mailto:${escapeHtml(payload.requesterEmail)}" style="color:#5E81AC;">${escapeHtml(payload.requesterEmail)}</a> to confirm or suggest alternatives.</li>
    </ol>
  `;

  const html = wrapHtml(subject, bodyHtml);

  if (isMailgunConfigured) {
    await sendViaMailgun(payload.ownerEmail, subject, text, html);
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `[email stub] Notification to ${payload.ownerEmail}:`,
      `${payload.requesterName} requested ${payload.startIso}`
    );
  }
}
