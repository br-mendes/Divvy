import { createClient } from '@supabase/supabase-js';

function pick(...vals: Array<string | undefined>) {
  for (const v of vals) {
    const s = (v ?? '').trim();
    if (s) return s;
  }
  return '';
}

export function getSupabaseUrl() {
  return pick(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
}

export function getSupabaseServiceRoleKey() {
  return pick(process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.SUPABASE_SERVICE_KEY);
}

/**
 * Server-only Supabase client with service role key.
 * Returns null when env is missing to avoid build-time crashes.
 */
export function createServiceSupabaseClient() {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
