import { NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/serviceClient';
import { getUserFromRequest } from '@/app/api/_utils/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function tryQuery<T>(fn: () => Promise<{ data: T | null; error: any }>) {
  try {
    const r = await fn();
    if (!r.error) return { ok: true as const, data: r.data };
    const msg = String(r.error?.message || '');
    const retry =
      msg.toLowerCase().includes('does not exist') ||
      msg.toLowerCase().includes('relation') ||
      msg.toLowerCase().includes('schema cache');
    return { ok: false as const, data: null, retry, error: r.error };
  } catch (e: any) {
    return { ok: false as const, data: null, retry: true as const, error: e };
  }
}

export async function GET(req: Request) {
  try {
    const auth = await getUserFromRequest(req);

    if (!auth) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' },
        { status: 401 }
      );
    }

    const service = createServiceSupabase();
    if (!service) {
      return NextResponse.json(
        { ok: false, code: 'MISSING_ENV', message: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL' },
        { status: 500 }
      );
    }

    const userId = auth.userId;

    // Fallback 1: divvy_members -> divvies
    const q1 = await tryQuery(() =>
      service.from('divvy_members').select('divvy_id, role, divvies(*)').eq('user_id', userId)
    );

    if (q1.ok && Array.isArray(q1.data)) {
      const groups = (q1.data as any[]).map((r) => ({
        id: r.divvy_id,
        role: r.role ?? null,
        ...(r.divvies ?? {}),
      }));
      return NextResponse.json({ ok: true, groups, authMode: auth.mode, source: 'divvy_members' });
    }
    if (!q1.ok && (q1 as any).retry === false) {
      return NextResponse.json(
        { ok: false, code: 'QUERY_FAILED', message: (q1 as any).error?.message ?? 'Failed', detail: (q1 as any).error },
        { status: 500 }
      );
    }

    // Fallback 2: group_members -> groups
    const q2 = await tryQuery(() =>
      service.from('group_members').select('group_id, role, groups(*)').eq('user_id', userId)
    );

    if (q2.ok && Array.isArray(q2.data)) {
      const groups = (q2.data as any[]).map((r) => ({
        id: r.group_id,
        role: r.role ?? null,
        ...(r.groups ?? {}),
      }));
      return NextResponse.json({ ok: true, groups, authMode: auth.mode, source: 'group_members' });
    }
    if (!q2.ok && (q2 as any).retry === false) {
      return NextResponse.json(
        { ok: false, code: 'QUERY_FAILED', message: (q2 as any).error?.message ?? 'Failed', detail: (q2 as any).error },
        { status: 500 }
      );
    }

    // Fallback 3: divvies.owner_id
    const q3 = await tryQuery(() => service.from('divvies').select('*').eq('owner_id', userId));

    if (q3.ok && Array.isArray(q3.data)) {
      return NextResponse.json({ ok: true, groups: q3.data, authMode: auth.mode, source: 'divvies.owner_id' });
    }

    // Nada bateu: devolve vazio mas com diagnóstico
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: auth.mode,
      source: 'none',
      note: 'No membership tables matched (checked: divvy_members/group_members/divvies.owner_id).',
    });
  } catch (e: any) {
    // SEMPRE JSON, mesmo no 500
    return NextResponse.json(
      {
        ok: false,
        code: 'UNHANDLED_ERROR',
        message: e?.message || 'Unhandled error',
        stack: process.env.NODE_ENV === 'production' ? undefined : String(e?.stack || ''),
      },
      { status: 500 }
    );
  }
}
