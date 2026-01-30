import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const TX_TABLES = [
  { table: 'transactions', divvyCol: 'divvyid' },
  { table: 'transactions', divvyCol: 'divvy_id' },
  { table: 'payment_transactions', divvyCol: 'divvyid' },
] as const;

async function pickTxTable(supabase: any) {
  for (const t of TX_TABLES) {
    const r = await tryQuery(() => supabase.from(t.table).select('id').limit(1));
    if (r.ok) return t;
  }
  return null;
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
  const fromUserId = String(body?.fromUserId ?? '').trim();
  const toUserId = String(body?.toUserId ?? '').trim();
  const amount = Number(body?.amount ?? 0);

  if (!divvyId || !fromUserId || !toUserId || !amount) {
    return NextResponse.json({ ok: false, error: 'Missing divvyId/fromUserId/toUserId/amount' }, { status: 400 });
  }

  if (fromUserId !== user.id) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const picked = await pickTxTable(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'Transactions table not found.' }, { status: 500 });

  const now = new Date().toISOString();

  const payloads = [
    {
      [picked.divvyCol]: divvyId,
      fromuserid: fromUserId,
      touserid: toUserId,
      amount,
      status: 'pending',
      createdat: now,
      updatedat: now,
    },
    {
      [picked.divvyCol]: divvyId,
      from_userid: fromUserId,
      to_userid: toUserId,
      amount,
      status: 'pending',
      created_at: now,
      updated_at: now,
    },
  ];

  let lastErr: any = null;
  for (const p of payloads) {
    const { data, error } = await supabase.from(picked.table).insert(p as any).select('*').single();
    if (!error) return NextResponse.json({ ok: true, transaction: data });
    lastErr = error;
  }

  return NextResponse.json({ ok: false, error: lastErr?.message ?? 'Failed to create transaction' }, { status: 500 });
}
