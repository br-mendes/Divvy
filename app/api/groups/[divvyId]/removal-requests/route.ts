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
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const picked = await pick(supabase);
  if (!picked) return NextResponse.json({ ok: true, divvyId, requests: [], note: 'No requests table found.' });

  const { data, error } = await supabase
    .from(picked.table)
    .select('*')
    .eq(picked.divvyCol, divvyId)
    .eq('type', 'remove_member')
    .eq('status', 'pending')
    .order('createdat', { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Add best-effort emails when table userprofiles exists.
  const rows = (data ?? []) as any[];
  const ids = Array.from(new Set(rows.flatMap((r) => [r.requested_by, r.target_userid]).filter(Boolean)));

  const profilesMap = new Map<string, any>();
  if (ids.length > 0) {
    const p1 = await tryQuery(() => supabase.from('userprofiles').select('id,email').in('id', ids));
    const p2 = p1.ok ? null : await tryQuery(() => supabase.from('user_profiles').select('id,email').in('id', ids));
    const profs = (p1.ok ? p1.data : p2?.ok ? p2.data : null) as any[] | null;
    (profs ?? []).forEach((p) => profilesMap.set(String(p.id), p));
  }

  const decorated = rows.map((r) => ({
    id: r.id,
    requestedby: r.requested_by,
    targetuserid: r.target_userid,
    reason: r.reason ?? null,
    status: r.status,
    createdat: r.createdat ?? r.created_at ?? null,
    requestedbyemail: profilesMap.get(String(r.requested_by))?.email ?? null,
    targetuseremail: profilesMap.get(String(r.target_userid))?.email ?? null,
  }));

  return NextResponse.json({ ok: true, divvyId, requests: decorated, source: picked });
}
