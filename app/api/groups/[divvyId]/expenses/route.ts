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
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const expenseDate =
    (typeof body?.expense_date === 'string' && body.expense_date.trim()) ||
    (typeof body?.expenseDate === 'string' && body.expenseDate.trim()) ||
    (typeof body?.date === 'string' && body.date.trim()) ||
    null;

  const effectiveDate = expenseDate ?? new Date().toISOString().slice(0, 10);
  await assertDateNotLocked(divvyId, effectiveDate);

  const amountCents =
    typeof body?.amount_cents === 'number' && Number.isFinite(body.amount_cents)
      ? Math.round(body.amount_cents)
      : toCents(body?.amount);
  const payerUserId =
    typeof body?.payeruserid === 'string'
      ? body.payeruserid
      : typeof body?.payerUserId === 'string'
        ? body.payerUserId
        : typeof body?.paidByUserId === 'string'
          ? body.paidByUserId
          : session.user.id;
  const currency = typeof body?.currency === 'string' ? body.currency : 'BRL';
  const splits = Array.isArray(body?.splits) ? body.splits : [];

  if (!amountCents || amountCents <= 0) {
    return NextResponse.json({ error: 'amount é obrigatório' }, { status: 400 });
  }

  if (!splits.length) {
    return NextResponse.json({ error: 'splits são obrigatórios' }, { status: 400 });
  }

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

  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      divvyid: divvyId,
      payeruserid: payerUserId,
      amount_cents: amountCents,
      currency,
      expense_date: effectiveDate,
      description: typeof body?.description === 'string' ? body.description : null,
      category: typeof body?.category === 'string' ? body.category : null,
      receiptphotourl:
        typeof body?.receiptPhotoUrl === 'string'
          ? body.receiptPhotoUrl
          : typeof body?.receiptphotourl === 'string'
            ? body.receiptphotourl
            : null,
    })
    .select('*')
    .single();

  if (expenseError) {
    return NextResponse.json({ error: expenseError.message }, { status: 500 });
  }

  const splitsPayload = splits.map((split: any) => ({
    expenseid: expense.id,
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
    await supabase.from('expenses').delete().eq('id', expense.id);
    return NextResponse.json({ error: splitsError.message }, { status: 500 });
  }

  return NextResponse.json({ expense }, { status: 201 });
}
