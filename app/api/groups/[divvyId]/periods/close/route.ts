import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const CANDIDATES = [
  { table: 'divvy_periods', divvyCol: 'divvyid' },
  { table: 'divvy_periods', divvyCol: 'divvy_id' },
  { table: 'periods', divvyCol: 'divvyid' },
  { table: 'periods', divvyCol: 'divvy_id' },
] as const;

async function pick(supabase: any) {
  for (const c of CANDIDATES) {
    const r = await tryQuery(() => supabase.from(c.table).select('id').limit(1));
    if (r.ok) return c;
  }
  return null;
}

export async function POST(req: Request, ctx: { params: { divvyId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const divvyId = ctx.params.divvyId;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  if (!perm.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const picked = await pick(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'No periods table found.' }, { status: 500 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const from = String(body?.from ?? '').trim();
  const to = String(body?.to ?? '').trim();
  if (!from || !to) return NextResponse.json({ ok: false, error: 'Missing from/to' }, { status: 400 });

  const now = new Date().toISOString();

  const payloads = [
    {
      [picked.divvyCol]: divvyId,
      period_from: from,
      period_to: to,
      status: 'closed',
      closed_at: now,
      snapshot: null,
      createdby: user.id,
      created_by: user.id,
      createdat: now,
    },
    {
      [picked.divvyCol]: divvyId,
      period_from: from,
      period_to: to,
      status: 'closed',
      closed_at: now,
      snapshot: null,
    },
  ];

  let lastErr: any = null;
  for (const p of payloads) {
    const { data, error } = await supabase.from(picked.table).insert(p as any).select('*').single();
    if (!error) {
      // Best-effort: lock expenses inside the range.
      try {
        // try common group id column names
        await supabase
          .from('expenses')
          .update({ locked: true })
          .eq('divvyid', divvyId)
          .gte('date', from)
          .lte('date', to);
      } catch {
        // ignore
      }
      try {
        await supabase
          .from('expenses')
          .update({ locked: true })
          .eq('divvy_id', divvyId)
          .gte('date', from)
          .lte('date', to);
      } catch {
        // ignore
      }

      return NextResponse.json({ ok: true, period: data, source: picked });
    }
    lastErr = error;
  }

  return NextResponse.json({ ok: false, error: lastErr?.message ?? 'Failed to close period' }, { status: 500 });
}
