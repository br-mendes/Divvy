import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

function getEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
}

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getEnv();

  if (!url || !anonKey) {
    const msg = 'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY';
    // In production this must exist; during build it may be absent.
    if (typeof window !== 'undefined') {
      throw new Error(msg);
    }
    return null as any;
  }

  return createBrowserClient<Database>(url, anonKey);
}

export const supabase = createSupabaseBrowserClient();
