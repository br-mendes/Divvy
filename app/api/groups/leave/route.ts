import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { MEMBERSHIP_SHAPES, getGroupRow, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const divvyId = String(body?.divvyId ?? body?.id ?? '').trim();
  if (!divvyId) return NextResponse.json({ ok: false, error: 'Missing divvyId' }, { status: 400 });

  // Prevent creator from leaving without transferring ownership.
  const g = await getGroupRow(supabase, divvyId);
  if (g.ok) {
    const ownerId = String(g.group?.[g.shape.ownerCol] ?? '');
    if (ownerId && ownerId === user.id) {
      return NextResponse.json({ ok: false, error: 'Creator cannot leave the group.' }, { status: 400 });
    }
  }

  for (const s of MEMBERSHIP_SHAPES) {
    const exists = await tryQuery(() => supabase.from(s.table).select('id').limit(1));
    if (!exists.ok) continue;

    const { error } = await supabase
      .from(s.table)
      .delete()
      .eq(s.groupIdCol, divvyId)
      .eq(s.userIdCol, user.id);

    if (!error) return NextResponse.json({ ok: true, action: 'left', via: s.table });
  }

  return NextResponse.json({ ok: false, error: 'Membership table not found or blocked.' }, { status: 500 });
}
