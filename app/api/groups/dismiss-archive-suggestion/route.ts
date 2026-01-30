import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { getGroupRow, requireMemberOrCreator } from '@/app/api/_utils/divvy';

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

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const g = await getGroupRow(supabase, divvyId);
  if (!g.ok) {
    return NextResponse.json({ ok: false, error: g.error?.message ?? 'Failed to load group' }, { status: g.status });
  }

  const table = g.shape.table;

  const payloads = [
    { archivesuggested: false, archivesuggestedat: null },
    { archive_suggested: false, archive_suggested_at: null },
  ];

  let lastErr: any = null;
  for (const p of payloads) {
    const { data, error } = await supabase.from(table).update(p as any).eq('id', divvyId).select('*').maybeSingle();
    if (!error) return NextResponse.json({ ok: true, group: data ?? null });
    lastErr = error;
  }

  return NextResponse.json({ ok: false, error: lastErr?.message ?? 'Failed to dismiss suggestion' }, { status: 500 });
}
