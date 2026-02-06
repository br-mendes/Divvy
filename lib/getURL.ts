export function getURL() {
  // Client: window is source of truth.
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }

  // Server: prefer explicit site URL.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    const u = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
    return u.replace(/\/$/, '');
  }

  // Vercel provides VERCEL_URL (no scheme).
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}

export function sanitizeNextPath(nextPath?: string | null) {
  const raw = (nextPath ?? '').toString().trim();
  if (!raw) return '/dashboard';
  if (!raw.startsWith('/')) return '/dashboard';
  if (raw.startsWith('//')) return '/dashboard';
  return raw;
}
