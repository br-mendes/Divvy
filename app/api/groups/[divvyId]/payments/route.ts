import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { assertDateNotLocked } from '@/lib/divvy/periodLocks';

const toCents = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value * 100);
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.round(parsed * 100);
    }
  }
  return null;
};

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
  const paidAt =
    (typeof body?.paid_at === 'string' && body.paid_at.trim()) ||
    (typeof body?.paidAt === 'string' && body.paidAt.trim()) ||
    null;

  const effectiveDate = paidAt ?? new Date().toISOString().slice(0, 10);
  await assertDateNotLocked(divvyId, effectiveDate);

  const amountCents =
    typeof body?.amount_cents === 'number' && Number.isFinite(body.amount_cents)
      ? Math.round(body.amount_cents)
      : toCents(body?.amount);
  const fromUserId =
    typeof body?.from_userid === 'string'
      ? body.from_userid
      : typeof body?.fromUserId === 'string'
        ? body.fromUserId
        : session.user.id;
  const toUserId =
    typeof body?.to_userid === 'string'
      ? body.to_userid
      : typeof body?.toUserId === 'string'
        ? body.toUserId
        : null;

  if (!amountCents || amountCents <= 0 || !toUserId) {
    return NextResponse.json({ error: 'amount e toUserId são obrigatórios' }, { status: 400 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from('divvymembers')
    .select('id')
    .eq('divvyid', divvyId)
    .eq('userid', session.user.id)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json({ error: 'Você não é membro deste grupo.' }, { status: 403 });
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      divvyid: divvyId,
      from_userid: fromUserId,
      to_userid: toUserId,
      amount_cents: amountCents,
      paid_at: effectiveDate,
    })
    .select('*')
    .single();

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({ payment }, { status: 201 });
}
