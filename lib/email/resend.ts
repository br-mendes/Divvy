import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export function getFromEmail() {
  return process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL ?? 'Divvy <noreply@divvy.com>';
}
