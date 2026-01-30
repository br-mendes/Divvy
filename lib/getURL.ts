export function getURL() {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL || // Vercel define isso automaticamente
    'http://localhost:3000';

  // No lado do cliente, window.location.origin é a fonte da verdade sobre onde o usuário está
  if (typeof window !== 'undefined') {
    url = window.location.origin;
  }

  // Garante que a URL começa com http/https
  url = url.startsWith('http') ? url : `https://${url}`;

  // Remove qualquer barra no final para evitar URLs como domain.com//auth/callback
  return url.replace(/\/$/, '');
}