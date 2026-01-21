import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const divvyId = searchParams.get('divvyId');

  if (!divvyId) {
    return NextResponse.json({ error: 'divvyId is required' }, { status: 400 });
  }

  try {
    const { data: members, error: mErr } = await supabase
      .from('divvymembers')
      .select('userid')
      .eq('divvyid', divvyId);

    if (mErr) throw mErr;

    const { data: expenses, error: eErr } = await supabase
      .from('expenses')
      .select('id, paidbyuserid, amount')
      .eq('divvyid', divvyId);

    if (eErr) throw eErr;

    const expenseIds = expenses?.map(e => e.id) || [];
    let splits: any[] = [];
    if (expenseIds.length > 0) {
      const { data: sData, error: sErr } = await supabase
        .from('expensesplits')
        .select('participantuserid, amountowed')
        .in('expenseid', expenseIds);

      if (sErr) throw sErr;
      splits = sData || [];
    }

    const { data: transactions, error: tErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('divvyid', divvyId)
      .order('createdat', { ascending: false });

    if (tErr) throw tErr;

    const balances: Record<string, number> = {};

    members?.forEach(m => {
      balances[m.userid] = 0;
    });

    expenses?.forEach(e => {
      if (balances[e.paidbyuserid] !== undefined) {
        balances[e.paidbyuserid] += e.amount;
      }
    });

    splits.forEach(s => {
      if (balances[s.participantuserid] !== undefined) {
        balances[s.participantuserid] -= s.amountowed;
      }
    });

    transactions?.forEach(t => {
      if (t.status === 'confirmed') {
        if (balances[t.fromuserid] !== undefined) balances[t.fromuserid] += t.amount;
        if (balances[t.touserid] !== undefined) balances[t.touserid] -= t.amount;
      }
    });

    return NextResponse.json({
      balances,
      transactions: transactions || [],
    }, { status: 200 });
  } catch (error: any) {
    console.error('Balance API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
