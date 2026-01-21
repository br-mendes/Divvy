import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

type BalanceMap = Record<string, number>;

type RouteParams = {
  params: {
    divvyId?: string;
  };
};

export async function GET(_req: Request, { params }: RouteParams) {
  const divvyId = params?.divvyId;

  if (!divvyId) {
    return NextResponse.json({ error: 'divvyId is required' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  const { data: members, error: mErr } = await supabase
    .from('divvymembers')
    .select('userid, userprofiles(email)')
    .eq('divvyid', divvyId);

  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  const { data: expenses, error: eErr } = await supabase
    .from('expenses')
    .select('id, paidbyuserid, amount')
    .eq('divvyid', divvyId);

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

  const expenseIds = expenses?.map((expense) => expense.id) || [];
  let splits: Array<{ participantuserid: string; amountowed: number }> = [];

  if (expenseIds.length > 0) {
    const { data: sData, error: sErr } = await supabase
      .from('expensesplits')
      .select('participantuserid, amountowed')
      .in('expenseid', expenseIds);

    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
    splits = sData || [];
  }

  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('from_userid, to_userid, amount_cents')
    .eq('divvyid', divvyId);

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  const { data: transactions, error: tErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('divvyid', divvyId)
    .order('createdat', { ascending: false });

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

  const paidOutBy = new Map<string, number>();
  const receivedBy = new Map<string, number>();
  const paidByUser = new Map<string, number>();
  const owedByUser = new Map<string, number>();
  const transactionAdjustBy = new Map<string, number>();

  for (const payment of payments ?? []) {
    const from = String((payment as { from_userid?: string }).from_userid);
    const to = String((payment as { to_userid?: string }).to_userid);
    const amt = Number((payment as { amount_cents?: number }).amount_cents) || 0;

    if (from) {
      paidOutBy.set(from, (paidOutBy.get(from) ?? 0) + amt);
    }
    if (to) {
      receivedBy.set(to, (receivedBy.get(to) ?? 0) + amt);
    }
  }

  expenses?.forEach((expense) => {
    const paid = paidByUser.get(expense.paidbyuserid) ?? 0;
    paidByUser.set(expense.paidbyuserid, paid + expense.amount);
  });

  splits.forEach((split) => {
    const owed = owedByUser.get(split.participantuserid) ?? 0;
    owedByUser.set(split.participantuserid, owed + split.amountowed);
  });

  transactions?.forEach((transaction) => {
    if (transaction.status === 'confirmed') {
      const fromAdjust = transactionAdjustBy.get(transaction.fromuserid) ?? 0;
      transactionAdjustBy.set(transaction.fromuserid, fromAdjust + transaction.amount);
      const toAdjust = transactionAdjustBy.get(transaction.touserid) ?? 0;
      transactionAdjustBy.set(transaction.touserid, toAdjust - transaction.amount);
    }
  });

  const balances: BalanceMap = {};
  const balanceDetails =
    members?.map((member) => {
      const uid = member.userid;
      const paid = paidByUser.get(uid) ?? 0;
      const owed = owedByUser.get(uid) ?? 0;
      const baseNet = paid - owed;

      const paidOut = paidOutBy.get(uid) ?? 0;
      const received = receivedBy.get(uid) ?? 0;

      const net = baseNet + paidOut - received + (transactionAdjustBy.get(uid) ?? 0);

      balances[uid] = net;

      return {
        userid: uid,
        email: member.userprofiles?.email ?? null,
        paid_cents: paid,
        owed_cents: owed,
        net_cents: net,
        payments_out_cents: paidOut,
        payments_in_cents: received
      };
    }) ?? [];

  return NextResponse.json({
    balances,
    balanceDetails,
    paidOutBy: Object.fromEntries(paidOutBy),
    receivedBy: Object.fromEntries(receivedBy),
    payments: payments || [],
    transactions: transactions || []
  });
}
