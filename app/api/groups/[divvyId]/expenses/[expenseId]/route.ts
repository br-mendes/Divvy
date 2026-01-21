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

export async function PATCH(
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
  const updates: Record<string, unknown> = {};

  if (typeof body?.description === 'string') updates.description = body.description;
  if (typeof body?.category === 'string') updates.category = body.category;
  if (typeof body?.currency === 'string') updates.currency = body.currency;
  if (typeof body?.expense_date === 'string') updates.expense_date = body.expense_date;
  if (typeof body?.payeruserid === 'string') updates.payeruserid = body.payeruserid;
  if (typeof body?.receiptPhotoUrl === 'string') updates.receiptphotourl = body.receiptPhotoUrl;
  if (typeof body?.receiptphotourl === 'string') updates.receiptphotourl = body.receiptphotourl;

  if (body?.amount_cents != null || body?.amount != null) {
    const amountCents =
      typeof body?.amount_cents === 'number' && Number.isFinite(body.amount_cents)
        ? Math.round(body.amount_cents)
        : toCents(body?.amount);
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: 'amount inválido' }, { status: 400 });
    }
    updates.amount_cents = amountCents;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'Nenhuma alteração enviada.' }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('expenses')
    .update(updates)
    .eq('divvyid', divvyId)
    .eq('id', expenseId)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ expense: updated });
}

export async function DELETE(
  _req: NextRequest,
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

  const { error: splitsError } = await supabase
    .from('expense_splits')
    .delete()
    .eq('expenseid', expenseId);

  if (splitsError) {
    return NextResponse.json({ error: splitsError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from('expenses')
    .delete()
    .eq('divvyid', divvyId)
    .eq('id', expenseId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
