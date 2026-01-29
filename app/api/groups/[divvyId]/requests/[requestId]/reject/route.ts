import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const CANDIDATES = [
  { table: 'divvy_requests', divvyCol: 'divvyid', idCol: 'id' },
  { table: 'divvy_requests', divvyCol: 'divvy_id', idCol: 'id' },
  { table: 'requests', divvyCol: 'divvyid', idCol: 'id' },
  { table: 'requests', divvyCol: 'divvy_id', idCol: 'id' },
] as const;

async function pick(supabase: any) {
  for (const c of CANDIDATES) {
    const r = await tryQuery(() => supabase.from(c.table).select('id').limit(1));
    if (r.ok) return c;
  }
  return null;
}

export async function POST(_req: Request, ctx: { params: { divvyId: string; requestId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { divvyId, requestId } = ctx.params;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;
  if (!perm.isAdmin) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const picked = await pick(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'No requests table found.' }, { status: 500 });

  const patch: any = { status: 'rejected', decided_by: user.id, decidedat: new Date().toISOString(), updatedat: new Date().toISOString() };
  const { error } = await supabase
    .from(picked.table)
    .update(patch)
    .eq(picked.divvyCol, divvyId)
    .eq(picked.idCol, requestId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
