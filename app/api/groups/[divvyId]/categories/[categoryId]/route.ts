import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { requireMemberOrCreator, slugify, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

const CANDIDATES = [
  { table: 'expense_categories', divvyCol: 'divvy_id', idCol: 'id' },
  { table: 'expense_categories', divvyCol: 'divvyid', idCol: 'id' },
  { table: 'categories', divvyCol: 'divvy_id', idCol: 'id' },
  { table: 'categories', divvyCol: 'divvyid', idCol: 'id' },
] as const;

async function pickTable(supabase: any) {
  for (const c of CANDIDATES) {
    const r = await tryQuery(() => supabase.from(c.table).select('id').limit(1));
    if (r.ok) return c;
  }
  return null;
}

export async function GET(_req: Request, ctx: { params: { divvyId: string; categoryId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { divvyId, categoryId } = ctx.params;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const picked = await pickTable(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'No categories table found.' }, { status: 500 });

  const { data, error } = await supabase
    .from(picked.table)
    .select('*')
    .eq(picked.divvyCol, divvyId)
    .eq(picked.idCol, categoryId)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, category: data, source: picked });
}

export async function PATCH(req: Request, ctx: { params: { divvyId: string; categoryId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { divvyId, categoryId } = ctx.params;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const picked = await pickTable(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'No categories table found.' }, { status: 500 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const patch: any = {};
  if (body?.name !== undefined) {
    const name = String(body.name ?? '').trim();
    if (!name) return NextResponse.json({ ok: false, error: 'Name cannot be empty' }, { status: 400 });
    patch.name = name;
    patch.slug = slugify(String(body?.slug ?? name));
  }
  if (body?.color !== undefined) patch.color = body.color ?? null;
  if (body?.icon !== undefined) patch.icon = body.icon ?? null;
  if (body?.isarchived !== undefined) patch.isarchived = Boolean(body.isarchived);
  if (body?.sortorder !== undefined) patch.sortorder = Number(body.sortorder);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
  }

  patch.updatedat = new Date().toISOString();
  patch.updated_at = patch.updatedat;

  const { data, error } = await supabase
    .from(picked.table)
    .update(patch)
    .eq(picked.divvyCol, divvyId)
    .eq(picked.idCol, categoryId)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, category: data, source: picked });
}

export async function DELETE(_req: Request, ctx: { params: { divvyId: string; categoryId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const { divvyId, categoryId } = ctx.params;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  const picked = await pickTable(supabase);
  if (!picked) return NextResponse.json({ ok: false, error: 'No categories table found.' }, { status: 500 });

  const { error } = await supabase
    .from(picked.table)
    .delete()
    .eq(picked.divvyCol, divvyId)
    .eq(picked.idCol, categoryId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
