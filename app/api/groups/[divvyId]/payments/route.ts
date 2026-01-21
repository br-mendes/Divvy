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

  let q = supabase
    .from('payments')
    .select('id, divvyid, createdby, from_userid, to_userid, amount_cents, currency, paid_at, note, createdat')
    .eq('divvyid', divvyId);

  if (from) q = q.gte('paid_at', from);
  if (to) q = q.lte('paid_at', to);

  const { data, error } = await q
    .order('paid_at', { ascending: false })
    .order('createdat', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ payments: data ?? [] });
}
