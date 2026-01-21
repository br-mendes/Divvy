import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

function csvEscape(value: unknown) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const { data: members } = await supabase
    .from('divvymembers')
    .select('userid, email')
    .eq('divvyid', divvyId);

  const emailById = new Map<string, string>();
  (members ?? []).forEach((member: { userid: string; email: string }) => {
    emailById.set(member.userid, member.email);
  });

  let q = supabase
    .from('expenses')
    .select(
      `
      id, expense_date, title, description, amount_cents, currency,
      payeruserid, categoryid,
      category:expense_categories(name, slug)
    `
    )
    .eq('divvyid', divvyId);

  if (from) {
    q = q.gte('expense_date', from);
  }
  if (to) {
    q = q.lte('expense_date', to);
  }

  const { data: expenses, error } = await q.order('expense_date', {
    ascending: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const lines: string[] = [];
  lines.push(
    ['id', 'date', 'title', 'description', 'amount', 'currency', 'payer_email', 'category'].join(',')
  );

  for (const expense of expenses ?? []) {
    const amount = ((Number(expense.amount_cents) || 0) / 100).toFixed(2);
    const payerEmail = emailById.get(expense.payeruserid) ?? expense.payeruserid;
    const categoryName = expense.category?.name ?? '';

    lines.push(
      [
        csvEscape(expense.id),
        csvEscape(expense.expense_date),
        csvEscape(expense.title),
        csvEscape(expense.description),
        csvEscape(amount),
        csvEscape(expense.currency),
        csvEscape(payerEmail),
        csvEscape(categoryName),
      ].join(',')
    );
  }

  const csv = lines.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="divvy-${divvyId}-expenses.csv"`,
    },
  });
}
