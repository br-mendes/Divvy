import { createClient } from '@supabase/supabase-js';

function pick(...vals: Array<string | undefined>) {
  for (const v of vals) {
    const s = (v ?? '').trim();
    if (s) return s;
  }
  return '';
}

export function createPublicSupabase() {
  const url = pick(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL);
  const anon = pick(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, process.env.SUPABASE_ANON_KEY);

  if (!url || !anon) return null;

  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
