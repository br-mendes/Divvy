import { Resend } from 'resend';

export function getAppUrl() {
  const publicUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (publicUrl) return publicUrl;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return 'https://' + vercel;

  return 'http://localhost:3000';
}

export function getFromEmail() {
  return process.env.FROM_EMAIL || 'Divvy <no-reply@divvy.local>';
}

export function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

/**
 * Backward-compat exports (código antigo do repo espera isso):
 * - resend (named)
 * - appUrl (named)
 * - EMAIL_FROM (named)
 */
export const appUrl = getAppUrl();
export const EMAIL_FROM = getFromEmail();

export const resend = getResendClient();
export default resend;