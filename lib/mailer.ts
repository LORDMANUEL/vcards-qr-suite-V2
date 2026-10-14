import nodemailer from 'nodemailer';

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';
  const authMethod = process.env.SMTP_AUTH_METHOD || 'LOGIN';

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    authMethod,
    tls: {
      servername: host,
      rejectUnauthorized,
    },
  });
}

export async function sendMail(payload: MailPayload): Promise<boolean> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!from) {
    console.warn('SMTP_FROM/SMTP_USER not configured, mail skipped');
    return false;
  }

  const transport = buildTransport();
  if (!transport) {
    console.warn('SMTP credentials missing, mail skipped for', payload.to);
    return false;
  }

  await transport.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  return true;
}
