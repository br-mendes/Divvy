import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';

type Transfer = { fromUserId: string; toUserId: string; amount_cents: number };

export async function GET(
  _req: Request,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  const { session } = await getMyRoleInDivvy(divvyId);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1) members (para mapear email e garantir membership)
  const { data: members, error: memErr } = await supabase
    .from('divvymembers')
    .select('userid, email, role')
    .eq('divvyid', divvyId);

  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

  const isMember = (members ?? []).some((m: any) => m.userid === session.user.id);
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const emailByUserId = new Map<string, string>();
  (members ?? []).forEach((m: any) => emailByUserId.set(m.userid, m.email));

  // 2) expenses
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select('id, payeruserid, amount_cents, currency')
    .eq('divvyid', divvyId);

  if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 });

  // 3) splits
  const { data: splits, error: spErr } = await supabase
    .from('expense_splits')
    .select('expenseid, userid, amount_cents')
    .eq('divvyid', divvyId);

  if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 });

  // 4) payments (ajuste do saldo)
  const { data: payments, error: payErr } = await supabase
    .from('payments')
    .select('from_userid, to_userid, amount_cents')
    .eq('divvyid', divvyId);

  if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

  // 5) compute
  const paidBy = new Map<string, number>();
  const owedBy = new Map<string, number>();
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

  const paidOutBy = new Map<string, number>();
  const receivedBy = new Map<string, number>();

  for (const p of payments ?? []) {
    const from = String((p as any).from_userid);
    const to = String((p as any).to_userid);
    const amt = Number((p as any).amount_cents) || 0;

    paidOutBy.set(from, (paidOutBy.get(from) ?? 0) + amt);
    receivedBy.set(to, (receivedBy.get(to) ?? 0) + amt);
  }

  // incluir todos os membros, mesmo se 0
  const balances = (members ?? []).map((m: any) => {
    const uid = m.userid as string;
    const paid = paidBy.get(uid) ?? 0;
    const owed = owedBy.get(uid) ?? 0;
    const baseNet = paid - owed;

    const paidOut = paidOutBy.get(uid) ?? 0;
    const received = receivedBy.get(uid) ?? 0;

    // quem PAGA melhora o net (+); quem RECEBE reduz (-)
    const net = baseNet + paidOut - received;
    return {
      userid: uid,
      email: m.email,
      paid_cents: paid,
      owed_cents: owed,
      net_cents: net,
      payments_out_cents: paidOut,
      payments_in_cents: received,
    };
  });

  // 6) suggested transfers (greedy)
  const transfers = settle(balances.map((b) => ({ userId: b.userid, net: b.net_cents })));

  const transfersWithEmail = transfers.map((t) => ({
    ...t,
    fromEmail: emailByUserId.get(t.fromUserId) ?? t.fromUserId,
    toEmail: emailByUserId.get(t.toUserId) ?? t.toUserId,
  }));

  // ordena: quem mais deve / quem mais recebe
  balances.sort((a, b) => a.net_cents - b.net_cents);

  return NextResponse.json({
    currency,
    balances,
    transfers: transfersWithEmail,
    meta: {
      expensesCount: (expenses ?? []).length,
      splitsCount: (splits ?? []).length,
    },
  });
}

function settle(items: Array<{ userId: string; net: number }>): Transfer[] {
  const creditors = items
    .filter((x) => x.net > 0)
    .map((x) => ({ userId: x.userId, amount: x.net }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = items
    .filter((x) => x.net < 0)
    .map((x) => ({ userId: x.userId, amount: -x.net }))
    .sort((a, b) => b.amount - a.amount);

  const out: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];

    const pay = Math.min(d.amount, c.amount);
    if (pay > 0) out.push({ fromUserId: d.userId, toUserId: c.userId, amount_cents: pay });

    d.amount -= pay;
    c.amount -= pay;

    if (d.amount === 0) i++;
    if (c.amount === 0) j++;
  }

  return out;
}
