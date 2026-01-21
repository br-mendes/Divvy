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
  const explicit = pickFirst(
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_SITEURL
  );

  if (explicit) return explicit;

  // Vercel runtime URL
  const vercelUrl = pickFirst(process.env.VERCEL_URL);
  if (vercelUrl) return `https://${vercelUrl}`;

  return 'http://localhost:3000';
}

export function getFromEmail() {
  // Try multiple env names for compatibility
  const from = pickFirst(
    process.env.RESEND_FROM,
    process.env.RESEND_FROM_EMAIL,
    process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL,
    process.env.NEXT_PUBLIC_RESEND_FROM,
    process.env.FROM_EMAIL,
    process.env.EMAIL_FROM
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

// Named export used by some routes/libs: import { resend } from '@/lib/email/resend'
export const resend = getResendClient();

// Default export used by other call-sites
export default resend;
