import { Resend } from 'resend';

function pickFirst(...values: Array<string | undefined | null>) {
  for (const v of values) {
    const s = (v ?? '').toString().trim();
    if (s) return s;
  }
  return '';
}

export function getAppUrl() {
  // Prefer explicit public URLs
  const explicit =
    pickFirst(
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_SITE_URL
    );

  if (explicit) return explicit;

  // Vercel runtime URL
  const vercelUrl = pickFirst(process.env.VERCEL_URL);
  if (vercelUrl) return `https://${vercelUrl}`;

  return 'http://localhost:3000';
}

export function getFromEmail() {
  // Try multiple env names for compatibility
  const from =
    pickFirst(
      process.env.RESEND_FROM,
      process.env.RESEND_FROM_EMAIL,
      process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL,
      process.env.NEXT_PUBLIC_RESEND_FROM,
      process.env.FROM_EMAIL
    );

  return from || 'Divvy <no-reply@divvy.local>';
}

export function getResendClient() {
  const key = pickFirst(process.env.RESEND_API_KEY);
  if (!key) return null;
  return new Resend(key);
}

// Backwards-compatible exports used across the codebase
export const appUrl = getAppUrl();
export const EMAIL_FROM = getFromEmail();

// Some files import { resend } from '@/lib/email/resend'
export const resend = getResendClient();

// Some files may default import resend
export default resend;
