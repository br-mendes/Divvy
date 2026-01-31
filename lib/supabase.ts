import { createBrowserClient } from '@supabase/ssr';

// Build-safe client component helper
// Don't throw during module initialization for build-time compatibility
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    // Return a dummy client for build time
    return null as any;
  }
  
  return createBrowserClient(url, anonKey);
}

// For backward compatibility, export a default client instance
// This will be null during build but will work at runtime
export const supabase = createClient();
