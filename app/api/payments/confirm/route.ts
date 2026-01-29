import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const TX_TABLES = [
  { table: 'transactions', idCol: 'id', divvyCol: 'divvyid' },
  { table: 'transactions', idCol: 'id', divvyCol: 'divvy_id' },
  { table: 'payment_transactions', idCol: 'id', divvyCol: 'divvyid' },
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

  const transactionId = String(body?.transactionId ?? body?.id ?? '').trim();
  if (!transactionId) return NextResponse.json({ ok: false, error: 'Missing transactionId' }, { status: 400 });

  const picked = await pickTxTable(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'Transactions table not found.' }, { status: 500 });

  const { data: tx, error: txErr } = await supabase.from(picked.table).select('*').eq(picked.idCol, transactionId).maybeSingle();
  if (txErr) return NextResponse.json({ ok: false, error: txErr.message }, { status: 500 });
  if (!tx) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

  const divvyId = String((tx as any)[picked.divvyCol] ?? '');
  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  // Only receiver can confirm.
  const toUserId = String((tx as any).touserid ?? (tx as any).to_userid ?? '');
  if (toUserId && toUserId !== user.id) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const patch: any = { status: 'confirmed', updatedat: now, updated_at: now, confirmedat: now, confirmed_at: now };
  const { data: updated, error } = await supabase
    .from(picked.table)
    .update(patch)
    .eq(picked.idCol, transactionId)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, transaction: updated });
}
