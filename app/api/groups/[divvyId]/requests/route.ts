import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const CANDIDATES = [
  { table: 'divvy_requests', divvyCol: 'divvyid' },
  { table: 'divvy_requests', divvyCol: 'divvy_id' },
  { table: 'requests', divvyCol: 'divvyid' },
  { table: 'requests', divvyCol: 'divvy_id' },
] as const;

async function pick(supabase: any) {
  for (const c of CANDIDATES) {
    const r = await tryQuery(() => supabase.from(c.table).select('id').limit(1));
    if (r.ok) return c;
  }
  return null;
}

export async function GET(_req: Request, ctx: { params: { divvyId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const divvyId = ctx.params.divvyId;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  if (!perm.isAdmin) {
    // normal members don't need this tab
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const picked = await pick(supabase);
  if (!picked) return NextResponse.json({ ok: true, divvyId, requests: [], note: 'No requests table found.' });

  const { data, error } = await supabase
    .from(picked.table)
    .select('*')
    .eq(picked.divvyCol, divvyId)
    .order('createdat', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, divvyId, requests: data ?? [], source: picked });
}
