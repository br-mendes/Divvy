import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/supabase/env';
import { tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const INVITE_TABLES = [
  { table: 'invites', tokenCol: 'token', divvyCol: 'divvy_id', emailCol: 'invitedemail', roleCol: 'role', statusCol: 'status', expiresCol: 'expiresat' },
  { table: 'invites', tokenCol: 'token', divvyCol: 'divvyid', emailCol: 'invitedemail', roleCol: 'role', statusCol: 'status', expiresCol: 'expiresat' },
  { table: 'divvyinvites', tokenCol: 'token', divvyCol: 'divvyid', emailCol: 'invitedemail', roleCol: 'role', statusCol: 'status', expiresCol: 'expiresat' },
] as const;

async function pickInviteTable(supabase: any) {
  for (const t of INVITE_TABLES) {
    const r = await tryQuery(() => supabase.from(t.table).select('id').limit(1));
    if (r.ok) return t;
  }
  return null;
}

async function getGroupName(supabase: any, divvyId: string) {
  const g1 = await tryQuery(() => supabase.from('divvies').select('name').eq('id', divvyId).maybeSingle());
  if (g1.ok && (g1.data as any)?.name) return String((g1.data as any).name);

  const g2 = await tryQuery(() => supabase.from('groups').select('name').eq('id', divvyId).maybeSingle());
  if (g2.ok && (g2.data as any)?.name) return String((g2.data as any).name);

  return null;
}

export async function GET(_req: Request, ctx: { params: { token: string } }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY' },
      { status: 500 }
    );
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Failed to init Supabase server client' }, { status: 500 });
  }

  const token = ctx.params.token;

  // Prefer security definer RPC (works even for anon with proper grants)
  const rpc = await supabase.rpc('get_invite_details', { invite_token: token });
  if (!rpc.error && Array.isArray(rpc.data) && rpc.data[0]) {
    const info: any = rpc.data[0];
    const expired = Boolean(info.is_expired);
    const status = String(info.status ?? '');
    return NextResponse.json({
      ok: true,
      invite: {
        valid: status === 'pending' && !expired,
        invitedemail: info.invitedemail ?? null,
        role: info.role ?? 'member',
        status,
        expired,
        divvy: { name: info.divvy_name ?? null },
      },
    });
  }

  const picked = await pickInviteTable(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'Invites table not found.' }, { status: 500 });

  const { data, error } = await supabase.from(picked.table).select('*').eq(picked.tokenCol, token).maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: 'Convite não encontrado' }, { status: 404 });

  const status = String((data as any)[picked.statusCol] ?? '');
  const expires = (data as any)[picked.expiresCol];
  const expired = expires ? new Date(String(expires)).getTime() < Date.now() : false;
  const divvyId = String((data as any)[picked.divvyCol] ?? '');
  const groupName = divvyId ? await getGroupName(supabase, divvyId) : null;

  const valid = status === 'pending' && !expired;

  return NextResponse.json({
    ok: true,
    invite: {
      valid,
      invitedemail: (data as any)[picked.emailCol] ?? null,
      role: (data as any)[picked.roleCol] ?? null,
      status,
      expired,
      divvy: { name: groupName },
    },
  });
}
