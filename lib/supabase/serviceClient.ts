import { createClient } from '@supabase/supabase-js';

function pickFirst(...values: Array<string | undefined | null>) {
  for (const v of values) {
    const s = (v ?? '').toString().trim();
    if (s) return s;
  }
  return '';
}

/**
 * Service-role Supabase client.
 * IMPORTANT: nunca dar throw no import/build.
 * Retorna null se faltar env.
 */
export function createServiceSupabase() {
  const url = pickFirst(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
  const key = pickFirst(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
