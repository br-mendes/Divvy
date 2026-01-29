import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, slugify, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const CANDIDATES = [
  { table: 'expense_categories', divvyCol: 'divvy_id' },
  { table: 'expense_categories', divvyCol: 'divvyid' },
  { table: 'categories', divvyCol: 'divvy_id' },
  { table: 'categories', divvyCol: 'divvyid' },
] as const;

async function pickCategoriesTable(supabase: any) {
  for (const c of CANDIDATES) {
    const r = await tryQuery(() => supabase.from(c.table).select('id').limit(1));
    if (r.ok) return c;
  }
  return null;
}

export async function GET(_req: Request, ctx: { params: { divvyId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const divvyId = ctx.params.divvyId;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const picked = await pickCategoriesTable(supabase);
  if (!picked) {
    return NextResponse.json({ ok: true, divvyId, categories: [], note: 'No categories table found.' });
  }

  const { data, error } = await supabase
    .from(picked.table)
    .select('*')
    .eq(picked.divvyCol, divvyId)
    .order('sortorder', { ascending: true })
    .order('createdat', { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, divvyId, categories: data ?? [], source: picked });
}

export async function POST(req: Request, ctx: { params: { divvyId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const divvyId = ctx.params.divvyId;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const picked = await pickCategoriesTable(supabase);
  if (!picked) {
    return NextResponse.json({ ok: false, error: 'No categories table found.' }, { status: 500 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const name = String(body?.name ?? '').trim();
  if (!name) {
    return NextResponse.json({ ok: false, error: 'Missing name' }, { status: 400 });
  }

  const color = body?.color ?? null;
  const icon = body?.icon ?? null;
  const sortorder = typeof body?.sortorder === 'number' ? body.sortorder : null;
  const slug = slugify(String(body?.slug ?? name));

  const payloads = [
    {
      [picked.divvyCol]: divvyId,
      name,
      slug,
      icon,
      color,
      sortorder,
      isarchived: false,
      createdby: user.id,
      created_by: user.id,
    },
    {
      [picked.divvyCol]: divvyId,
      name,
      slug,
      icon,
      color,
      sortorder,
      isarchived: false,
    },
  ];

  let lastErr: any = null;
  for (const p of payloads) {
    const { data, error } = await supabase.from(picked.table).insert(p as any).select('*').single();
    if (!error) {
      return NextResponse.json({ ok: true, category: data, source: picked });
    }
    lastErr = error;
  }

  return NextResponse.json({ ok: false, error: lastErr?.message ?? 'Failed to create category' }, { status: 500 });
}
