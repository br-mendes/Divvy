import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

async function getUser(supabase: any) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function loadExpense(supabase: any, divvyId: string, expenseId: string) {
  const attempts = [
    { sel: 'id,divvyid,amount,locked', divvyCol: 'divvyid' },
    { sel: 'id,divvy_id,amount,locked', divvyCol: 'divvy_id' },
  ] as const;

  let lastErr: any = null;
  for (const a of attempts) {
    const { data, error } = await supabase.from('expenses').select(a.sel).eq('id', expenseId).maybeSingle();
    if (!error && data) {
      const row: any = data;
      if (String(row[a.divvyCol] ?? '') !== String(divvyId)) {
        return { ok: false as const, status: 404 as const, error: null, expense: null };
      }
      return { ok: true as const, status: 200 as const, error: null, expense: row };
    }
    lastErr = error;
  }

  return { ok: false as const, status: 500 as const, error: lastErr, expense: null };
}

type SplitSource =
  | { kind: 'expensesplits_amountowed'; table: 'expensesplits' }
  | { kind: 'expensesplits_amount'; table: 'expensesplits' }
  | { kind: 'expense_splits_cents'; table: 'expense_splits' };

async function pickSplitsSource(supabase: any): Promise<SplitSource | null> {
  const tries: Array<{ src: SplitSource; select: string }> = [
    { src: { kind: 'expensesplits_amountowed', table: 'expensesplits' }, select: 'id,expenseid,participantuserid,amountowed,createdat,updatedat' },
    { src: { kind: 'expensesplits_amount', table: 'expensesplits' }, select: 'id,expenseid,userid,amount,createdat,updatedat' },
    { src: { kind: 'expense_splits_cents', table: 'expense_splits' }, select: 'id,expense_id,user_id,amount_cents,created_at,updated_at' },
  ];

  for (const t of tries) {
    const r = await supabase.from(t.src.table).select(t.select).limit(1);
    if (!r.error) return t.src;
  }
  return null;
}

async function listSplits(supabase: any, src: SplitSource, expenseId: string) {
  if (src.kind === 'expensesplits_amountowed') {
    const { data, error } = await supabase
      .from(src.table)
      .select('participantuserid,amountowed')
      .eq('expenseid', expenseId);
    return {
      error,
      rows: (data ?? []).map((r: any) => ({ userid: r.participantuserid, amount_cents: Math.round(Number(r.amountowed) * 100) })),
    };
  }

  if (src.kind === 'expensesplits_amount') {
    const { data, error } = await supabase
      .from(src.table)
      .select('userid,amount')
      .eq('expenseid', expenseId);
    return {
      error,
      rows: (data ?? []).map((r: any) => ({ userid: r.userid, amount_cents: Math.round(Number(r.amount) * 100) })),
    };
  }

  const { data, error } = await supabase
    .from(src.table)
    .select('user_id,amount_cents')
    .eq('expense_id', expenseId);
  return {
    error,
    rows: (data ?? []).map((r: any) => ({ userid: r.user_id, amount_cents: Number(r.amount_cents) })),
  };
}

async function replaceSplits(
  supabase: any,
  src: SplitSource,
  expenseId: string,
  payload: Array<{ userid: string; amount_cents: number }>
) {
  // wipe
  if (src.kind === 'expense_splits_cents') {
    const del = await supabase.from(src.table).delete().eq('expense_id', expenseId);
    if (del.error) return del.error;

    const rows = payload.map((s) => ({ expense_id: expenseId, user_id: s.userid, amount_cents: s.amount_cents }));
    const ins = await supabase.from(src.table).insert(rows as any);
    return ins.error;
  }

  const del = await supabase.from(src.table).delete().eq('expenseid', expenseId);
  if (del.error) return del.error;

  if (src.kind === 'expensesplits_amountowed') {
    const rows = payload.map((s) => ({ expenseid: expenseId, participantuserid: s.userid, amountowed: s.amount_cents / 100 }));
    const ins = await supabase.from(src.table).insert(rows as any);
    return ins.error;
  }

  const rows = payload.map((s) => ({ expenseid: expenseId, userid: s.userid, amount: s.amount_cents / 100 }));
  const ins = await supabase.from(src.table).insert(rows as any);
  return ins.error;
}

export async function GET(_req: Request, ctx: { params: { divvyId: string; expenseId: string } }) {
  const { divvyId, expenseId } = ctx.params;
  const supabase = createRouteHandlerClient({ cookies });

  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' }, { status: 401 });
  }

  const exp = await loadExpense(supabase, divvyId, expenseId);
  if (!exp.ok) {
    const status = exp.status;
    return NextResponse.json(
      { ok: false, code: status === 404 ? 'NOT_FOUND' : 'DB_ERROR', error: exp.error?.message ?? 'Failed' },
      { status }
    );
  }

  const src = await pickSplitsSource(supabase);
  if (!src) {
    return NextResponse.json({ ok: true, divvyId, expenseId, splits: [], note: 'No splits table found.' });
  }

  const res = await listSplits(supabase, src, expenseId);
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, divvyId, expenseId, splits: res.rows, source: src });
}

export async function POST(req: Request, ctx: { params: { divvyId: string; expenseId: string } }) {
  const { divvyId, expenseId } = ctx.params;
  const supabase = createRouteHandlerClient({ cookies });

  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' }, { status: 401 });
  }

  const exp = await loadExpense(supabase, divvyId, expenseId);
  if (!exp.ok) {
    return NextResponse.json(
      { ok: false, error: exp.error?.message ?? 'Expense not found' },
      { status: exp.status }
    );
  }

  if (Boolean((exp.expense as any)?.locked)) {
    return NextResponse.json({ ok: false, error: 'Expense is locked' }, { status: 409 });
  }

  const src = await pickSplitsSource(supabase);
  if (!src) {
    return NextResponse.json({ ok: false, error: 'No splits table found.' }, { status: 500 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const mode = String(body?.mode ?? 'manual');
  const amount = Number((exp.expense as any)?.amount ?? 0);
  const totalCents = Math.round(amount * 100);

  let payload: Array<{ userid: string; amount_cents: number }> = [];

  if (mode === 'equal') {
    const userIds = Array.isArray(body?.userIds) ? body.userIds.map((x: any) => String(x)) : [];
    if (!userIds.length) return NextResponse.json({ ok: false, error: 'Missing userIds' }, { status: 400 });

    const base = Math.floor(totalCents / userIds.length);
    const rem = totalCents - base * userIds.length;
    payload = userIds.map((uid: string, idx: number) => ({ userid: uid, amount_cents: base + (idx < rem ? 1 : 0) }));
  } else {
    const splits = Array.isArray(body?.splits) ? body.splits : [];
    payload = splits.map((s: any) => ({ userid: String(s.userid), amount_cents: Number(s.amountCents ?? s.amount_cents ?? 0) }));
  }

  const invalid = payload.some((s) => !s.userid || !Number.isFinite(s.amount_cents) || s.amount_cents < 0);
  if (invalid) return NextResponse.json({ ok: false, error: 'Invalid splits payload' }, { status: 400 });

  const sum = payload.reduce((acc, s) => acc + s.amount_cents, 0);
  if (sum !== totalCents) {
    return NextResponse.json({ ok: false, error: 'Splits sum must equal expense total' }, { status: 400 });
  }

  const writeErr = await replaceSplits(supabase, src, expenseId, payload);
  if (writeErr) return NextResponse.json({ ok: false, error: writeErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
