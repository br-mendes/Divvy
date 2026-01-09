
/**
 * Dynamic URL helper to ensure redirects point to the correct domain.
 */
export const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL || // Provided production URL: https://divvy-roan.vercel.app
    process.env.NEXT_PUBLIC_VERCEL_URL || 
    'http://localhost:3000/';

  // Protocol check
  url = url.startsWith('http') ? url : `https://${url}`;

  // Trailing slash normalization
  return url.endsWith('/') ? url : `${url}/`;
};
