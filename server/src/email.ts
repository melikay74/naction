import nodemailer, { type Transporter } from 'nodemailer';
import type { Application, Category } from './types.js';

/**
 * Email notifications for partner applications.
 *
 * Everything is configured through environment variables so no credential ever
 * reaches the repository. Set these in cPanel's Setup Node.js App screen:
 *
 *   SMTP_HOST        mail.yourdomain.com
 *   SMTP_PORT        465 (implicit TLS) or 587 (STARTTLS)
 *   SMTP_USER        the sending mailbox, e.g. hello@yourdomain.com
 *   SMTP_PASS        that mailbox's password
 *   SMTP_FROM        "NAction Advisors <hello@yourdomain.com>" — must be on your
 *                    own domain, or SPF rejects it. The display name in front is
 *                    free text and is what applicants actually see.
 *   APPLICATIONS_TO  where notifications land; any address, defaults to SMTP_USER
 *
 * With SMTP_HOST unset, sending is skipped entirely and the application is
 * still recorded — so local development and staging work untouched.
 */

const CATEGORY_LABELS: Record<Category, string> = {
  tow: 'Tow truck service',
  repair: 'Collision repair shop',
  legal: 'Personal injury attorney',
};

let transporter: Transporter | null = null;
let warnedUnconfigured = false;

export function emailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 465);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });
  return transporter;
}

/**
 * Strips CR and LF before a value is placed in a mail header.
 *
 * Applicant-supplied text reaches Reply-To and the subject line. A newline
 * there could inject extra headers — a Bcc, say — and turn the form into an
 * open relay. Length is already capped during validation.
 */
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function applicationSummary(application: Application): string {
  return [
    `Business:     ${application.businessName}`,
    `Type:         ${CATEGORY_LABELS[application.businessType]}`,
    `Contact:      ${application.contactName}`,
    `Phone:        ${application.phone}`,
    `Email:        ${application.email}`,
    `Service area: ${application.serviceArea}`,
    `Website:      ${application.website || '—'}`,
    '',
    `Submitted:    ${new Date(application.submittedAt).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      dateStyle: 'full',
      timeStyle: 'short',
    })} (Pacific)`,
    `Reference:    ${application.id}`,
  ].join('\n');
}

function notificationEmail(application: Application) {
  return {
    subject: headerSafe(
      `New partner application: ${application.businessName} (${CATEGORY_LABELS[application.businessType]})`,
    ),
    // Replying to the notification goes straight to the applicant.
    replyTo: headerSafe(`${application.contactName} <${application.email}>`),
    text: [
      'A business has applied to join the network.',
      '',
      applicationSummary(application),
      '',
      'Reply to this email to reach the applicant directly.',
    ].join('\n'),
  };
}

function confirmationEmail(application: Application, replyTo: string) {
  return {
    subject: 'We received your NAction Advisors partner application',
    replyTo: headerSafe(replyTo),
    text: [
      `Hi ${application.contactName},`,
      '',
      'Thanks for applying to join the NAction Advisors partner network. We have your',
      'application and will review it personally — someone will be in touch at this',
      'address.',
      '',
      'Here is what you sent us:',
      '',
      applicationSummary(application),
      '',
      'If anything above is wrong, just reply to this email and we will correct it.',
      '',
      '— NAction Advisors',
      'Your first call after an accident.',
    ].join('\n'),
  };
}

/**
 * Sends the notification and the applicant's confirmation.
 *
 * Called after the application is already saved to disk, and deliberately
 * never throws into the request. The saved record is the source of truth; email
 * is a notification on top of it, and a mail outage must not cost an
 * application or show the applicant an error for something that worked.
 */
export async function sendApplicationEmails(application: Application): Promise<void> {
  if (!emailConfigured()) {
    if (!warnedUnconfigured) {
      warnedUnconfigured = true;
      console.warn(
        '[naction] SMTP is not configured — applications are saved to disk but no email is sent. ' +
          'Set SMTP_HOST, SMTP_USER and SMTP_PASS to enable it.',
      );
    }
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  const to = process.env.APPLICATIONS_TO || process.env.SMTP_USER!;
  const mail = getTransporter();

  const notification = notificationEmail(application);
  const confirmation = confirmationEmail(application, to);

  // Settled, not all: the applicant's copy failing must not hide the
  // notification, and vice versa.
  const results = await Promise.allSettled([
    mail.sendMail({ from, to, ...notification }),
    mail.sendMail({ from, to: headerSafe(application.email), ...confirmation }),
  ]);

  const labels = ['notification', 'applicant confirmation'];
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(
        `[naction] failed to send ${labels[i]} for application ${application.id}:`,
        result.reason,
      );
    }
  });
}

/**
 * A redacted report on the mail configuration, for the staging-only
 * diagnostics endpoint. Never returns the password, and shows only the first
 * character of the mailbox — enough to confirm which account is in use without
 * publishing it.
 */
export async function emailDiagnostics(): Promise<Record<string, unknown>> {
  const user = process.env.SMTP_USER ?? '';
  const from = process.env.SMTP_FROM ?? '';
  const mask = (address: string) => {
    const at = address.indexOf('@');
    if (at < 1) return address ? '(set)' : '(unset)';
    return `${address[0]}***${address.slice(at)}`;
  };

  // Titan and most providers refuse to send as any address other than the one
  // you authenticated with — the single most common cause of silent failure.
  const fromAddress = from.match(/<([^>]+)>/)?.[1] ?? from;
  /**
   * The password itself is never reported — only its shape. A length that does
   * not match what you typed, or stray surrounding quotes, means the control
   * panel mangled the value on the way in, which looks identical to a wrong
   * password from the server's side.
   */
  const pass = process.env.SMTP_PASS ?? '';
  const risky = [...new Set([...pass].filter((c) => '$`\\"\'!'.includes(c)))];

  const report: Record<string, unknown> = {
    configured: emailConfigured(),
    host: process.env.SMTP_HOST ?? '(unset)',
    port: process.env.SMTP_PORT ?? '465 (default)',
    user: mask(user),
    from: mask(fromAddress),
    fromMatchesUser: fromAddress.toLowerCase() === user.toLowerCase(),
    notificationsTo: mask(process.env.APPLICATIONS_TO || user),
    password: {
      length: pass.length,
      hasLeadingOrTrailingSpace: pass !== pass.trim(),
      looksQuoted: pass.length > 1 && /^['"].*['"]$/.test(pass),
      charsThatOftenGetMangled: risky.length ? risky.join(' ') : 'none',
    },
  };

  if (!emailConfigured()) {
    report.verify = 'skipped — SMTP_HOST, SMTP_USER or SMTP_PASS is missing';
    return report;
  }

  try {
    await getTransporter().verify();
    report.verify = 'ok — connected and authenticated';
  } catch (err) {
    report.verify = 'FAILED';
    report.error = err instanceof Error ? err.message : String(err);
  }
  return report;
}

/** Verifies the SMTP connection at boot so misconfiguration surfaces early. */
export async function verifyEmail(): Promise<void> {
  if (!emailConfigured()) return;
  try {
    await getTransporter().verify();
    console.log(`[naction] SMTP ready — notifications go to ${process.env.APPLICATIONS_TO || process.env.SMTP_USER}`);
  } catch (err) {
    console.error('[naction] SMTP check FAILED — applications will save but no email will send:', err);
  }
}
