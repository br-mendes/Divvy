import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { MEMBERSHIP_SHAPES, requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

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

async function removeMember(supabase: any, divvyId: string, userIdToRemove: string) {
  for (const s of MEMBERSHIP_SHAPES) {
    const exists = await tryQuery(() => supabase.from(s.table).select('id').limit(1));
    if (!exists.ok) continue;

    const del = await supabase
      .from(s.table)
      .delete()
      .eq(s.groupIdCol, divvyId)
      .eq(s.userIdCol, userIdToRemove);

    if (!del.error) return { ok: true as const, via: s.table };
  }
  return { ok: false as const, via: 'none' };
}

export async function POST(req: Request, ctx: { params: { divvyId: string; requestId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { divvyId, requestId } = ctx.params;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;
  if (!perm.isAdmin) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const picked = await pick(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'No requests table found.' }, { status: 500 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const decision = String(body?.decision ?? '').toLowerCase();
  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json({ ok: false, error: 'Invalid decision' }, { status: 400 });
  }

  const { data: reqRow, error: loadErr } = await supabase
    .from(picked.table)
    .select('*')
    .eq(picked.divvyCol, divvyId)
    .eq(picked.idCol, requestId)
    .maybeSingle();

  if (loadErr) return NextResponse.json({ ok: false, error: loadErr.message }, { status: 500 });
  if (!reqRow) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  if (String((reqRow as any).type ?? '') !== 'remove_member') {
    return NextResponse.json({ ok: false, error: 'Not a removal request' }, { status: 400 });
  }
  if (String((reqRow as any).status ?? '') !== 'pending') {
    return NextResponse.json({ ok: false, error: 'Request is not pending' }, { status: 400 });
  }

  if (decision === 'approved') {
    const target = String((reqRow as any).target_userid ?? (reqRow as any).targetuserid ?? '');
    if (!target) return NextResponse.json({ ok: false, error: 'Missing target' }, { status: 400 });

    const removed = await removeMember(supabase, divvyId, target);
    if (!removed.ok) return NextResponse.json({ ok: false, error: 'Failed to remove member' }, { status: 500 });
  }

  const patch: any = {
    status: decision,
    decided_by: user.id,
    decidedat: new Date().toISOString(),
    note: String(body?.note ?? '').trim() || null,
    updatedat: new Date().toISOString(),
  };

  const { error } = await supabase
    .from(picked.table)
    .update(patch)
    .eq(picked.divvyCol, divvyId)
    .eq(picked.idCol, requestId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
