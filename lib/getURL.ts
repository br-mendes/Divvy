
/**
 * Dynamic URL helper to ensure redirects point to the correct domain.
 * Prioritizes window.location.origin on the client side for maximum reliability.
 */
export const getURL = () => {
  // Client-side: use the current origin
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    return origin.endsWith('/') ? origin : `${origin}/`;
  }

  // Server-side or fallback: use environment variables
  let url =
    process.env.NEXT_PUBLIC_SITE_URL || 
    process.env.NEXT_PUBLIC_VERCEL_URL || 
    'http://localhost:3000/';

  // Protocol check (Vercel variables often omit it)
  url = url.startsWith('http') ? url : `https://${url}`;

  // Trailing slash normalization
  return url.endsWith('/') ? url : `${url}/`;
};
