import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { divvyId: string; expenseId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, expenseId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: expense, error: expErr } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', expenseId)
    .eq('divvyid', divvyId)
    .single();

  if (expErr || !expense) {
    return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
  }

  const { data: splits, error: spErr } = await supabase
    .from('expense_splits')
    .select('id, userid, amount_cents')
    .eq('expenseid', expenseId)
    .order('amount_cents', { ascending: false });

  if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 });

  return NextResponse.json({ expense, splits: splits ?? [] });
}

export async function PATCH(
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

  const patch: Record<string, string | number | null> = {};
  if (body.title != null) patch.title = String(body.title).trim();
  if (body.description !== undefined) patch.description = String(body.description).trim() || null;
  if (body.payerUserId != null) patch.payeruserid = String(body.payerUserId).trim();
  if (body.expenseDate != null) patch.expense_date = String(body.expenseDate).trim();
  if (body.currency != null) patch.currency = String(body.currency).trim().toUpperCase();
  if (body.amountCents != null) patch.amount_cents = Math.round(Number(body.amountCents));

  const { data, error } = await supabase
    .from('expenses')
    .update(patch)
    .eq('id', expenseId)
    .eq('divvyid', divvyId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { divvyId: string; expenseId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, expenseId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('divvyid', divvyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
