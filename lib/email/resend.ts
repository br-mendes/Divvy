import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.RESEND_FROM || 'nao-responda@divvyapp.online';

export function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://divvy-roan.vercel.app';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
