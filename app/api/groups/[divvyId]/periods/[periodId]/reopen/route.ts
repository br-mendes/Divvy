import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const CANDIDATES = [
  { table: 'divvy_periods', divvyCol: 'divvyid', idCol: 'id' },
  { table: 'divvy_periods', divvyCol: 'divvy_id', idCol: 'id' },
  { table: 'periods', divvyCol: 'divvyid', idCol: 'id' },
  { table: 'periods', divvyCol: 'divvy_id', idCol: 'id' },
] as const;

async function pick(supabase: any) {
  for (const c of CANDIDATES) {
    const r = await tryQuery(() => supabase.from(c.table).select('id').limit(1));
    if (r.ok) return c;
  }
  return null;
}

export async function POST(_req: Request, ctx: { params: { divvyId: string; periodId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { divvyId, periodId } = ctx.params;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;
  if (!perm.isAdmin) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const picked = await pick(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'No periods table found.' }, { status: 500 });

  const patch: any = { status: 'open', reopened_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from(picked.table)
    .update(patch)
    .eq(picked.divvyCol, divvyId)
    .eq(picked.idCol, periodId)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  // Best-effort: unlock expenses within this period.
  const from = String((data as any).period_from ?? '');
  const to = String((data as any).period_to ?? '');
  if (from && to) {
    try {
      await supabase
        .from('expenses')
        .update({ locked: false })
        .eq('divvyid', divvyId)
        .gte('date', from)
        .lte('date', to);
    } catch {
      // ignore
    }
    try {
      await supabase
        .from('expenses')
        .update({ locked: false })
        .eq('divvy_id', divvyId)
        .gte('date', from)
        .lte('date', to);
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ ok: true, period: data });
}
