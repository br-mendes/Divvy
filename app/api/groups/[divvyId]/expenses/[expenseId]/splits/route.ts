import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { assertDateNotLocked } from '@/lib/divvy/periodLocks';

const toCents = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value * 100);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed * 100);
    }
  }
  return null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { divvyId: string; expenseId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, expenseId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: membership, error: membershipError } = await supabase
    .from('divvymembers')
    .select('id')
    .eq('divvyid', divvyId)
    .eq('userid', session.user.id)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json({ error: 'Você não é membro deste grupo.' }, { status: 403 });
  }

  const { data: expense, error: expenseFetchError } = await supabase
    .from('expenses')
    .select('id, expense_date')
    .eq('divvyid', divvyId)
    .eq('id', expenseId)
    .single();

  if (expenseFetchError) {
    return NextResponse.json({ error: expenseFetchError.message }, { status: 500 });
  }

  if (!expense) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  }

  await assertDateNotLocked(divvyId, expense.expense_date);

  const body = await req.json();
  const splits = Array.isArray(body?.splits) ? body.splits : [];

  if (!splits.length) {
    return NextResponse.json({ error: 'splits são obrigatórios' }, { status: 400 });
  }

  const splitsPayload = splits.map((split: any) => ({
    expenseid: expenseId,
    userid: String(split?.userid ?? split?.userId ?? split?.participantuserid ?? ''),
    amount_cents:
      typeof split?.amount_cents === 'number' && Number.isFinite(split.amount_cents)
        ? Math.round(split.amount_cents)
        : toCents(split?.amount) ?? 0,
  }));

  if (splitsPayload.some((split) => !split.userid || split.amount_cents <= 0)) {
    return NextResponse.json({ error: 'splits inválidos' }, { status: 400 });
  }

  const { error: splitsError } = await supabase.from('expense_splits').insert(splitsPayload);

  if (splitsError) {
    return NextResponse.json({ error: splitsError.message }, { status: 500 });
  }

  return NextResponse.json({ splits: splitsPayload }, { status: 201 });
}
