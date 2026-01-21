import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(
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

  const body = await req.json();
  const paidByUserId = String(body?.paidByUserId ?? '').trim();
  const amount = Number(body?.amount);
  const category = String(body?.category ?? '').trim();
  const description = String(body?.description ?? '').trim();
  const date = String(body?.date ?? '').trim();
  const receiptPhotoUrl = String(body?.receiptPhotoUrl ?? '').trim() || null;
  const categoryId = body?.categoryId ? String(body.categoryId).trim() : null;

  if (!paidByUserId || !Number.isFinite(amount) || !category || !description || !date) {
    return NextResponse.json(
      { error: 'Dados incompletos para criar despesa.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      divvyid: divvyId,
      paidbyuserid: paidByUserId,
      amount,
      category,
      description,
      date,
      receiptphotourl: receiptPhotoUrl,
      categoryid: categoryId || null,
      locked: false,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expense: data }, { status: 201 });
}

export async function GET(
  _req: NextRequest,
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

  const { data, error } = await supabase
    .from('expenses')
    .select(
      `
      id, title, description, amount_cents, currency, expense_date,
      payeruserid, createdby, createdat,
      categoryid,
      category:expense_categories(id, name, slug, color)
    `
    )
    .eq('divvyid', divvyId)
    .order('expense_date', { ascending: false })
    .order('createdat', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expenses: data ?? [] });
}
