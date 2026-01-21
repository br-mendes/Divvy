import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

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

  const body = await req.json();

  // mode: "equal" | "manual"
  const mode = String(body?.mode ?? 'equal');

  const { data: expense, error: expErr } = await supabase
    .from('expenses')
    .select('id, divvyid, amount_cents')
    .eq('id', expenseId)
    .eq('divvyid', divvyId)
    .single();

  if (expErr || !expense) {
    return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
  }

  // Apaga splits anteriores
  const { error: delErr } = await supabase
    .from('expense_splits')
    .delete()
    .eq('expenseid', expenseId);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  let splitsToInsert: Array<{ expenseid: string; divvyid: string; userid: string; amount_cents: number }> = [];

  if (mode === 'manual') {
    const splits = Array.isArray(body?.splits) ? body.splits : [];
    if (!splits.length) return NextResponse.json({ error: 'splits obrigatório' }, { status: 400 });

    let sum = 0;
    for (const s of splits) {
      const userId = String(s.userid ?? '').trim();
      const amount = Math.round(Number(s.amountCents ?? 0));
      if (!userId || amount < 0) {
        return NextResponse.json({ error: 'split inválido' }, { status: 400 });
      }
      sum += amount;
      splitsToInsert.push({ expenseid: expenseId, divvyid, userid: userId, amount_cents: amount });
    }

    if (sum !== expense.amount_cents) {
      return NextResponse.json(
        { error: 'Soma dos splits deve ser igual ao total da despesa' },
        { status: 400 }
      );
    }
  } else {
    // equal split por lista de userIds
    const userIds = Array.isArray(body?.userIds) ? body.userIds.map((x: unknown) => String(x)) : [];
    if (!userIds.length) return NextResponse.json({ error: 'userIds obrigatório' }, { status: 400 });

    const total = Number(expense.amount_cents);
    const n = userIds.length;
    const base = Math.floor(total / n);
    const remainder = total - base * n;

    splitsToInsert = userIds.map((uid: string, idx: number) => ({
      expenseid: expenseId,
      divvyid,
      userid: uid,
      amount_cents: base + (idx < remainder ? 1 : 0),
    }));
  }

  const { data: inserted, error: insErr } = await supabase
    .from('expense_splits')
    .insert(splitsToInsert)
    .select('id, userid, amount_cents');

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, splits: inserted ?? [] });
}
