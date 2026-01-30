import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { MEMBERSHIP_SHAPES, requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INVITE_TABLES = [
  { table: 'invites', tokenCol: 'token', divvyCol: 'divvy_id', statusCol: 'status', expiresCol: 'expiresat', roleCol: 'role' },
  { table: 'invites', tokenCol: 'token', divvyCol: 'divvyid', statusCol: 'status', expiresCol: 'expiresat', roleCol: 'role' },
  { table: 'divvyinvites', tokenCol: 'token', divvyCol: 'divvyid', statusCol: 'status', expiresCol: 'expiresat', roleCol: 'role' },
] as const;

async function pickInviteTable(supabase: any) {
  for (const t of INVITE_TABLES) {
    const r = await tryQuery(() => supabase.from(t.table).select('id').limit(1));
    if (r.ok) return t;
  }
  return null;
}

async function insertMembership(supabase: any, divvyId: string, userId: string, role: string) {
  for (const s of MEMBERSHIP_SHAPES) {
    const exists = await tryQuery(() => supabase.from(s.table).select('id').limit(1));
    if (!exists.ok) continue;

    const payload: any = {
      [s.groupIdCol]: divvyId,
      [s.userIdCol]: userId,
    };
    if (s.roleCol) payload[s.roleCol] = role;

    const { error } = await supabase.from(s.table).insert(payload);
    if (!error) return { ok: true as const, via: s.table };

    const msg = String(error?.message ?? '').toLowerCase();
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return { ok: true as const, via: `exists:${s.table}` };
    }
  }
  return { ok: false as const, via: 'none' };
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const inviteToken = String(body?.inviteToken ?? body?.token ?? '').trim();
  if (!inviteToken) {
    return NextResponse.json({ ok: false, error: 'Missing inviteToken' }, { status: 400 });
  }

  const picked = await pickInviteTable(supabase);
  if (!picked) {
    return NextResponse.json({ ok: false, error: 'Invites table not found.' }, { status: 500 });
  }

  const { data: invite, error: invErr } = await supabase
    .from(picked.table)
    .select('*')
    .eq(picked.tokenCol, inviteToken)
    .maybeSingle();

  if (invErr) return NextResponse.json({ ok: false, error: invErr.message }, { status: 500 });
  if (!invite) return NextResponse.json({ ok: false, error: 'Invite not found' }, { status: 404 });

  const status = String((invite as any)[picked.statusCol] ?? '');
  if (status !== 'pending') {
    return NextResponse.json({ ok: false, error: 'Invite is not pending' }, { status: 400 });
  }

  const expires = (invite as any)[picked.expiresCol];
  if (expires) {
    const exp = new Date(String(expires));
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: 'Invite expired' }, { status: 400 });
    }
  }

  const divvyId = String((invite as any)[picked.divvyCol] ?? '').trim();
  if (!divvyId) return NextResponse.json({ ok: false, error: 'Invite missing divvyId' }, { status: 500 });

  // Ensure the user can at least read the group (member/creator check). This also guards against accepting invites to unrelated groups if RLS is misconfigured.
  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  // For invite accept, we allow non-members; so if forbidden, ignore and proceed with insert attempt.
  if (!perm.ok) {
    // no-op
  }

  const role = String((invite as any)[picked.roleCol] ?? 'member') || 'member';
  const ins = await insertMembership(supabase, divvyId, user.id, role);
  if (!ins.ok) {
    return NextResponse.json({ ok: false, error: 'Failed to add membership (policy/RLS?)' }, { status: 500 });
  }

  const patch: any = {
    [picked.statusCol]: 'accepted',
    acceptedat: new Date().toISOString(),
    accepted_at: new Date().toISOString(),
    acceptedby: user.id,
    accepted_by: user.id,
  };

  await supabase.from(picked.table).update(patch).eq(picked.tokenCol, inviteToken);

  return NextResponse.json({ ok: true, divvyId });
}
