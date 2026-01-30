import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const CANDIDATES = [
  { table: 'payments', divvyCol: 'divvyid', paidAtCol: 'paid_at' },
  { table: 'payments', divvyCol: 'divvy_id', paidAtCol: 'paid_at' },
  { table: 'payments', divvyCol: 'divvyid', paidAtCol: 'paidat' },
  { table: 'payments', divvyCol: 'divvy_id', paidAtCol: 'paidat' },
] as const;

async function pickPaymentsTable(supabase: any) {
  for (const c of CANDIDATES) {
    const r = await tryQuery(() => supabase.from(c.table).select('id').limit(1));
    if (r.ok) return c;
  }
  return null;
}

export async function GET(req: Request, ctx: { params: { divvyId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const divvyId = ctx.params.divvyId;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const picked = await pickPaymentsTable(supabase);
  if (!picked) return NextResponse.json({ ok: true, divvyId, payments: [], note: 'No payments table found.' });

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let q = supabase.from(picked.table).select('*').eq(picked.divvyCol, divvyId);
  if (from) q = q.gte(picked.paidAtCol, from);
  if (to) q = q.lte(picked.paidAtCol, to);
  q = q.order(picked.paidAtCol, { ascending: false });

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, divvyId, payments: data ?? [], source: picked });
}

export async function POST(req: Request, ctx: { params: { divvyId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const divvyId = ctx.params.divvyId;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const picked = await pickPaymentsTable(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'No payments table found.' }, { status: 500 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const from_userid = String(body?.from_userid ?? body?.fromUserId ?? user.id);
  const to_userid = String(body?.to_userid ?? body?.toUserId ?? '');
  const amount_cents = Number(body?.amount_cents ?? body?.amountCents ?? 0);
  const currency = String(body?.currency ?? 'BRL');
  const paid_at = String(body?.paid_at ?? new Date().toISOString());
  const note = body?.note ?? null;

  if (!to_userid || !amount_cents) {
    return NextResponse.json({ ok: false, error: 'Missing to_userid/amount_cents' }, { status: 400 });
  }

  const payloads = [
    {
      [picked.divvyCol]: divvyId,
      createdby: user.id,
      created_by: user.id,
      from_userid,
      to_userid,
      amount_cents,
      currency,
      paid_at,
      paidat: paid_at,
      note,
    },
    {
      [picked.divvyCol]: divvyId,
      from_userid,
      to_userid,
      amount_cents,
      currency,
      paid_at,
      paidat: paid_at,
      note,
    },
  ];

  let lastErr: any = null;
  for (const p of payloads) {
    const { data, error } = await supabase.from(picked.table).insert(p as any).select('*').single();
    if (!error) return NextResponse.json({ ok: true, payment: data, source: picked });
    lastErr = error;
  }

  return NextResponse.json({ ok: false, error: lastErr?.message ?? 'Failed to create payment' }, { status: 500 });
}
