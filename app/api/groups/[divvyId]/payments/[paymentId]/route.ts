import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const CANDIDATES = [
  { table: 'payments', divvyCol: 'divvyid', idCol: 'id' },
  { table: 'payments', divvyCol: 'divvy_id', idCol: 'id' },
] as const;

async function pick(supabase: any) {
  for (const c of CANDIDATES) {
    const r = await tryQuery(() => supabase.from(c.table).select('id').limit(1));
    if (r.ok) return c;
  }
  return null;
}

export async function GET(_req: Request, ctx: { params: { divvyId: string; paymentId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { divvyId, paymentId } = ctx.params;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const picked = await pick(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'No payments table found.' }, { status: 500 });

  const { data, error } = await supabase
    .from(picked.table)
    .select('*')
    .eq(picked.divvyCol, divvyId)
    .eq(picked.idCol, paymentId)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, payment: data });
}

export async function DELETE(_req: Request, ctx: { params: { divvyId: string; paymentId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { divvyId, paymentId } = ctx.params;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const picked = await pick(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'No payments table found.' }, { status: 500 });

  const { error } = await supabase
    .from(picked.table)
    .delete()
    .eq(picked.divvyCol, divvyId)
    .eq(picked.idCol, paymentId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
