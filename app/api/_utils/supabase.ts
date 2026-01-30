import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';

export function jsonError(status: number, code: string, message: string, extra?: any) {
  return NextResponse.json(
    { ok: false, code, message, ...(extra ? { extra } : {}) },
    { status }
  );
}

export async function requireUser() {
  if (!hasSupabaseEnv()) {
    return {
      supabase: null as any,
      user: null as any,
      error: jsonError(
        500,
        'MISSING_SUPABASE_ENV',
        'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY'
      ),
    };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return {
      supabase: null as any,
      user: null as any,
      error: jsonError(
        500,
        'SUPABASE_INIT_FAILED',
        'Failed to init Supabase server client'
      ),
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return {
      supabase,
      user: null as any,
      error: jsonError(401, 'UNAUTHENTICATED', 'You must be logged in'),
    };
  }

  return { supabase, user: data.user, error: null as any };
}

/**
 * Helpers to tolerate schema drift:
 * - tries multiple table names
 * - tries multiple column names
 */
export async function pickFirstWorkingTable(
  supabase: any,
  tables: string[]
): Promise<{ table: string | null; lastError?: any }> {
  let lastError: any = null;
  for (const t of tables) {
    const test = await supabase.from(t).select('id').limit(1);
    if (!test.error) return { table: t };
    lastError = test.error;
  }
  return { table: null, lastError };
}

export async function trySelectWithFilters(
  supabase: any,
  table: string,
  select: string,
  filters: Array<{ col: string; val: any }>,
  order?: { col: string; asc: boolean },
  limit?: number
): Promise<{ data: any; error: any; usedFilters: any }> {
  let lastError: any = null;

  for (const f of filters) {
    let q = supabase.from(table).select(select).eq(f.col, f.val);
    if (order) q = q.order(order.col, { ascending: order.asc });
    if (limit) q = q.limit(limit);

    const res = await q;
    if (!res.error) return { data: res.data, error: null, usedFilters: [f] };
    lastError = res.error;
  }

  return { data: null, error: lastError, usedFilters: null };
}