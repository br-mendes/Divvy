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
    .from('payments')
    .select('id, divvyid, createdby, from_userid, to_userid, amount_cents, currency, paid_at, note, createdat')
    .eq('divvyid', divvyId)
    .order('paid_at', { ascending: false })
    .order('createdat', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ payments: data ?? [] });
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

  const fromUserId = String(body?.fromUserId ?? '').trim();
  const toUserId = String(body?.toUserId ?? '').trim();
  const paidAt = String(body?.paidAt ?? '').trim() || undefined;
  const note = String(body?.note ?? '').trim() || null;

  const amountCents = Math.round(Number(body?.amountCents ?? 0));
  if (!fromUserId || !toUserId) {
    return NextResponse.json(
      { error: 'fromUserId e toUserId são obrigatórios' },
      { status: 400 }
    );
  }
  if (fromUserId === toUserId) {
    return NextResponse.json(
      { error: 'fromUserId e toUserId não podem ser iguais' },
      { status: 400 }
    );
  }
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return NextResponse.json({ error: 'amountCents inválido' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      divvyid: divvyId,
      createdby: session.user.id,
      from_userid: fromUserId,
      to_userid: toUserId,
      amount_cents: amountCents,
      currency: 'BRL',
      paid_at: paidAt,
      note,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ payment: data }, { status: 201 });
}
