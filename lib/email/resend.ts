import { Resend } from 'resend';

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'http://localhost:3000';

export const EMAIL_FROM =
  process.env.FROM_EMAIL || 'Divvy <no-reply@divvy.local>';

export function getAppUrl() {
  return appUrl;
}

export function getFromEmail() {
  return EMAIL_FROM;
}

export function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// alguns pontos do projeto importam `resend` como named export
export const resend = getResendClient();

// compat: se alguém usa default import
export default resend;
