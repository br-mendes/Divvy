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
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to = searchParams.get('to'); // YYYY-MM-DD

  const supabase = createServerSupabaseClient();

  let q = supabase
    .from('expenses')
    .select('id, title, description, amount_cents, currency, expense_date, payeruserid, createdby, createdat')
    .eq('divvyid', divvyId);

  if (from) q = q.gte('expense_date', from);
  if (to) q = q.lte('expense_date', to);

  const { data, error } = await q
    .order('expense_date', { ascending: false })
    .order('createdat', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data ?? [] });
}
