import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { MEMBERSHIP_SHAPES, tryQuery } from '@/app/api/_utils/divvy';

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
    if (msg.includes('duplicate') || msg.includes('unique')) return { ok: true as const, via: `exists:${s.table}` };
  }
  return { ok: false as const, via: 'none' };
}

export async function POST(_req: Request, ctx: { params: { token: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const token = ctx.params.token;

  const picked = await pickInviteTable(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'Invites table not found.' }, { status: 500 });

  const { data: invite, error: invErr } = await supabase
    .from(picked.table)
    .select('*')
    .eq(picked.tokenCol, token)
    .maybeSingle();

  if (invErr) return NextResponse.json({ ok: false, error: invErr.message }, { status: 500 });
  if (!invite) return NextResponse.json({ ok: false, error: 'Convite não encontrado' }, { status: 404 });

  const status = String((invite as any)[picked.statusCol] ?? '');
  const expires = (invite as any)[picked.expiresCol];
  const expired = expires ? new Date(String(expires)).getTime() < Date.now() : false;

  if (status !== 'pending' || expired) {
    return NextResponse.json({ ok: false, error: 'Convite não está disponível' }, { status: 400 });
  }

  const divvyId = String((invite as any)[picked.divvyCol] ?? '');
  const role = String((invite as any)[picked.roleCol] ?? 'member') || 'member';
  if (!divvyId) return NextResponse.json({ ok: false, error: 'Invite missing divvyId' }, { status: 500 });

  const ins = await insertMembership(supabase, divvyId, user.id, role);
  if (!ins.ok) {
    return NextResponse.json({ ok: false, error: 'Failed to add membership (policy/RLS?)' }, { status: 500 });
  }

  await supabase
    .from(picked.table)
    .update({
      [picked.statusCol]: 'accepted',
      acceptedat: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
      acceptedby: user.id,
      accepted_by: user.id,
    })
    .eq(picked.tokenCol, token);

  return NextResponse.json({ ok: true, divvyId });
}
