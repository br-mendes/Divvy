import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';
import { isSystemAdminEmail } from '@/lib/auth/admin';

export async function POST(
  req: NextRequest,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  const { session, role, isCreator } = await getMyRoleInDivvy(divvyId);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSystemAdmin = isSystemAdminEmail(session.user.email);
  const canManage = isSystemAdmin || isCreator || role === 'admin';
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const from = String(body?.from ?? '').trim();
  const to = String(body?.to ?? '').trim();
  if (!from || !to) {
    return NextResponse.json({ error: 'from e to são obrigatórios (YYYY-MM-DD)' }, { status: 400 });
  }

  // 1) montar snapshot (usando a mesma lógica do balances)
  // expenses no período
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select('id, payeruserid, amount_cents, currency, expense_date')
    .eq('divvyid', divvyId)
    .gte('expense_date', from)
    .lte('expense_date', to);

  if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 });

  const expenseIds = (expenses ?? []).map((e: any) => e.id);

  // splits só das despesas do período
  let splits: any[] = [];
  if (expenseIds.length) {
    const { data: sp, error: spErr } = await supabase
      .from('expense_splits')
      .select('expenseid, userid, amount_cents')
      .eq('divvyid', divvyId)
      .in('expenseid', expenseIds);

    if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 });
    splits = sp ?? [];
  }

  // payments no período
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('from_userid, to_userid, amount_cents, paid_at')
    .eq('divvyid', divvyId)
    .gte('paid_at', from)
    .lte('paid_at', to);

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  // members
  const { data: members, error: memErr } = await supabase
    .from('divvymembers')
    .select('userid, email, role')
    .eq('divvyid', divvyId);

  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

  const paidBy = new Map<string, number>();
  const owedBy = new Map<string, number>();
  const paidOutBy = new Map<string, number>();
  const receivedBy = new Map<string, number>();
  const currency = (expenses?.[0]?.currency ?? 'BRL') as string;

  for (const e of expenses ?? []) {
    const payer = String((e as any).payeruserid);
    const amt = Number((e as any).amount_cents) || 0;
    paidBy.set(payer, (paidBy.get(payer) ?? 0) + amt);
  }

  for (const s of splits ?? []) {
    const uid = String((s as any).userid);
    const amt = Number((s as any).amount_cents) || 0;
    owedBy.set(uid, (owedBy.get(uid) ?? 0) + amt);
  }

  for (const p of payments ?? []) {
    const fromU = String((p as any).from_userid);
    const toU = String((p as any).to_userid);
    const amt = Number((p as any).amount_cents) || 0;
    paidOutBy.set(fromU, (paidOutBy.get(fromU) ?? 0) + amt);
    receivedBy.set(toU, (receivedBy.get(toU) ?? 0) + amt);
  }

  const balances = (members ?? []).map((m: any) => {
    const uid = m.userid as string;
    const paid = paidBy.get(uid) ?? 0;
    const owed = owedBy.get(uid) ?? 0;
    const baseNet = paid - owed;

    const paidOut = paidOutBy.get(uid) ?? 0;
    const received = receivedBy.get(uid) ?? 0;
    const net = baseNet + paidOut - received;

    return { userid: uid, email: m.email, paid_cents: paid, owed_cents: owed, net_cents: net };
  });

  const totalExpenses = (expenses ?? []).reduce(
    (a: number, e: any) => a + (Number(e.amount_cents) || 0),
    0
  );
  const totalPayments = (payments ?? []).reduce(
    (a: number, p: any) => a + (Number(p.amount_cents) || 0),
    0
  );

  const snapshot = {
    from,
    to,
    currency,
    totals: { expenses_cents: totalExpenses, payments_cents: totalPayments },
    counts: {
      expenses: (expenses ?? []).length,
      splits: (splits ?? []).length,
      payments: (payments ?? []).length,
    },
    balances,
  };

  // 2) inserir período fechado (se já existir, retornar erro amigável)
  const { data: inserted, error: insErr } = await supabase
    .from('divvy_periods')
    .insert({
      divvyid: divvyId,
      period_from: from,
      period_to: to,
      status: 'closed',
      closed_by: session.user.id,
      snapshot,
    })
    .select('*')
    .single();

  if (insErr) {
    // unique conflict
    return NextResponse.json({ error: insErr.message }, { status: 409 });
  }

  return NextResponse.json({ period: inserted }, { status: 201 });
}
