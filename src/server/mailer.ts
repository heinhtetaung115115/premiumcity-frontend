import nodemailer from 'nodemailer';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;
let usingEthereal = false;

async function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    usingEthereal = false;
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587/25
      auth: { user, pass },
    });
  }

  // DEV fallback: Ethereal test account (no real delivery; gives preview URL)
  const testAccount = await nodemailer.createTestAccount();
  usingEthereal = true;
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

async function getTransporter() {
  if (!transporterPromise) transporterPromise = buildTransporter();
  return transporterPromise;
}

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const transporter = await getTransporter();
  const fromName = process.env.MAIL_FROM_NAME || 'Premium City';
  const fromEmail = process.env.MAIL_FROM_EMAIL || 'no-reply@example.com';

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  });

  // If we’re on Ethereal, generate preview URL
  const previewUrl = usingEthereal ? nodemailer.getTestMessageUrl(info) : null;

  return { messageId: info.messageId, previewUrl, usingEthereal };
}
