<<<<<<< HEAD
export function getURL() {
  let url =
    process?.env?.NEXT_PUBLIC_APP_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/';
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Make sure to including trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
}
=======

/**
 * Helper para garantir que as URLs de redirecionamento apontem para o domínio correto.
 */
export const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL || // Vercel define isso automaticamente
    'http://localhost:3000';

  // No lado do cliente, window.location.origin é a fonte da verdade sobre onde o usuário está
  if (typeof window !== 'undefined') {
    url = window.location.origin;
  }

  // Garante que a URL comece com http/https
  url = url.startsWith('http') ? url : `https://${url}`;
  
  // Remove qualquer barra no final para evitar URLs como domain.com//auth/callback
  return url.replace(/\/$/, '');
};
>>>>>>> 3742ed0ae9e93e68ce111148d75a3f9568b2e852
