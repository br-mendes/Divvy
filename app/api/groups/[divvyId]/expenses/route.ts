import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('expenses')
    .select('id, title, description, amount_cents, currency, expense_date, payeruserid, createdby, createdat')
    .eq('divvyid', divvyId)
    .order('expense_date', { ascending: false })
    .order('createdat', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const title = String(body?.title ?? '').trim();
  const description = String(body?.description ?? '').trim() || null;
  const payerUserId = String(body?.payerUserId ?? '').trim();
  const currency = (String(body?.currency ?? 'BRL').trim() || 'BRL').toUpperCase();
  const expenseDate = String(body?.expenseDate ?? '').trim() || null;

  const amountCents = Number(body?.amountCents ?? 0);
  if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
  if (!payerUserId) return NextResponse.json({ error: 'payerUserId é obrigatório' }, { status: 400 });
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: 'amountCents inválido' }, { status: 400 });
  }

  const { data: exp, error } = await supabase
    .from('expenses')
    .insert({
      divvyid: divvyId,
      createdby: session.user.id,
      payeruserid: payerUserId,
      title,
      description,
      amount_cents: Math.round(amountCents),
      currency,
      expense_date: expenseDate ?? undefined,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ expense: exp }, { status: 201 });
}
