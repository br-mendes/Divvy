import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';
import { getURL } from '@/lib/getURL';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INVITE_TABLES = [
  { table: 'invites', tokenCol: 'token', divvyCol: 'divvy_id', emailCol: 'invitedemail', statusCol: 'status', roleCol: 'role', expiresCol: 'expiresat' },
  { table: 'invites', tokenCol: 'token', divvyCol: 'divvyid', emailCol: 'invitedemail', statusCol: 'status', roleCol: 'role', expiresCol: 'expiresat' },
  { table: 'divvyinvites', tokenCol: 'token', divvyCol: 'divvyid', emailCol: 'invitedemail', statusCol: 'status', roleCol: 'role', expiresCol: 'expiresat' },
] as const;

async function pickInviteTable(supabase: any) {
  for (const t of INVITE_TABLES) {
    const r = await tryQuery(() => supabase.from(t.table).select('id').limit(1));
    if (r.ok) return t;
  }
  return null;
}

function makeToken() {
  // short-ish token for URLs
  return crypto.randomUUID().replace(/-/g, '');
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

  const divvyId = String(body?.divvyId ?? '').trim();
  const invitedEmail = String(body?.email ?? '').trim().toLowerCase();

  if (!divvyId || !invitedEmail) {
    return NextResponse.json({ ok: false, error: 'Missing divvyId/email' }, { status: 400 });
  }

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;
  if (!perm.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const picked = await pickInviteTable(supabase);
  if (!picked) {
    return NextResponse.json({ ok: false, error: 'Invites table not found.' }, { status: 500 });
  }

  const token = makeToken();
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const payloads = [
    {
      [picked.tokenCol]: token,
      [picked.divvyCol]: divvyId,
      [picked.emailCol]: invitedEmail,
      invitedbyuserid: user.id,
      invited_by: user.id,
      [picked.roleCol]: 'member',
      [picked.statusCol]: 'pending',
      [picked.expiresCol]: expires,
      createdat: now.toISOString(),
      created_at: now.toISOString(),
    },
    {
      [picked.tokenCol]: token,
      [picked.divvyCol]: divvyId,
      [picked.emailCol]: invitedEmail,
      [picked.roleCol]: 'member',
      [picked.statusCol]: 'pending',
      [picked.expiresCol]: expires,
    },
  ];

  let lastErr: any = null;
  for (const p of payloads) {
    const { error } = await supabase.from(picked.table).insert(p as any);
    if (!error) {
      const inviteLink = `${getURL()}/join/${token}`;
      return NextResponse.json({ ok: true, inviteLink });
    }
    lastErr = error;
  }

  return NextResponse.json({ ok: false, error: lastErr?.message ?? 'Failed to create invite' }, { status: 500 });
}
