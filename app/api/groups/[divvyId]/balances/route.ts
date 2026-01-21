import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

type RouteParams = {
  params: {
    divvyId: string;
  };
};

export async function GET(_req: Request, { params }: RouteParams) {
  const { divvyId } = params;

  if (!divvyId) {
    return NextResponse.json({ error: 'ID do grupo obrigatório' }, { status: 400 });
  }

  const { searchParams } = new URL(_req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const supabase = createServerSupabaseClient();

  const { data: members, error: memErr } = await supabase
    .from('divvymembers')
    .select('userid')
    .eq('divvyid', divvyId);

  if (memErr) {
    return NextResponse.json({ error: memErr.message }, { status: 500 });
  }

  let expQ = supabase
    .from('expenses')
    .select('id, payeruserid, amount_cents, currency, expense_date')
    .eq('divvyid', divvyId);

  if (from) expQ = expQ.gte('expense_date', from);
  if (to) expQ = expQ.lte('expense_date', to);

  const { data: expenses, error: expErr } = await expQ;

  if (expErr) {
    return NextResponse.json({ error: expErr.message }, { status: 500 });
  }

  const expenseIds = (expenses ?? []).map((e: any) => e.id);
  let splits: any[] = [];

  if (expenseIds.length) {
    const { data: sp, error: spErr } = await supabase
      .from('expense_splits')
      .select('expenseid, userid, amount_cents')
      .eq('divvyid', divvyId)
      .in('expenseid', expenseIds);

    if (spErr) {
      return NextResponse.json({ error: spErr.message }, { status: 500 });
    }
    splits = sp ?? [];
  }

  let payQ = supabase
    .from('payments')
    .select('from_userid, to_userid, amount_cents, paid_at')
    .eq('divvyid', divvyId);

  if (from) payQ = payQ.gte('paid_at', from);
  if (to) payQ = payQ.lte('paid_at', to);

  const { data: payments, error: payErr } = await payQ;

  if (payErr) {
    return NextResponse.json({ error: payErr.message }, { status: 500 });
  }

  const balances: Record<string, number> = {};

  members?.forEach(m => {
    balances[m.userid] = 0;
  });

  expenses?.forEach(e => {
    if (balances[e.payeruserid] !== undefined) {
      balances[e.payeruserid] += e.amount_cents;
    }
  });

  splits.forEach(s => {
    if (balances[s.userid] !== undefined) {
      balances[s.userid] -= s.amount_cents;
    }
  });

  payments?.forEach(p => {
    if (balances[p.from_userid] !== undefined) {
      balances[p.from_userid] += p.amount_cents;
    }
    if (balances[p.to_userid] !== undefined) {
      balances[p.to_userid] -= p.amount_cents;
    }
  });

  return NextResponse.json({ balances, payments: payments ?? [] });
}
