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
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('expense_categories')
    .select(
      'id, divvyid, name, slug, icon, color, sortorder, isarchived, createdat, updatedat'
    )
    .eq('divvyid', divvyId)
    .order('sortorder', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data ?? [] });
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
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body?.name ?? '').trim();
  const slug = String(body?.slug ?? '').trim() || null;
  const icon = String(body?.icon ?? '').trim() || null;
  const color = String(body?.color ?? '').trim() || null;
  const sortorder = Number.isFinite(Number(body?.sortorder))
    ? Number(body.sortorder)
    : 0;

  if (!name) {
    return NextResponse.json({ error: 'name é obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('expense_categories')
    .insert({ divvyid: divvyId, name, slug, icon, color, sortorder })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ category: data }, { status: 201 });
}
