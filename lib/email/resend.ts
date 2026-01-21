import { Resend } from 'resend';

/**
 * Compat layer:
 * Alguns arquivos importam:
 * - resend
 * - appUrl
 * - EMAIL_FROM
 * - getAppUrl / getFromEmail / getResendClient
 */

export function getAppUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    '';
  return fromEnv || 'http://localhost:3000';
}

export function getFromEmail() {
  // suportar chaves antigas e novas
  return process.env.RESEND_FROM || process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || process.env.FROM_EMAIL || 'Divvy <no-reply@divvy.local>';
}

export function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// exports “simples” que o resto do app costuma usar
export const appUrl = getAppUrl();
export const EMAIL_FROM = getFromEmail();

// muitos lugares importam "resend" como named export
export const resend = getResendClient();

// manter também default export para compatibilidade
export default resend;
