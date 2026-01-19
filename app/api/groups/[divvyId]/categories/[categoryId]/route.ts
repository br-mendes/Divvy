import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { divvyId: string; categoryId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, categoryId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const patch: any = { updatedat: new Date().toISOString() };

  if (body?.name !== undefined) {
    const name = String(body.name ?? '').trim();
    if (!name) {
      return NextResponse.json(
        { error: 'name não pode ser vazio' },
        { status: 400 }
      );
    }
    patch.name = name;
  }

  if (body?.slug !== undefined) {
    patch.slug = body.slug ? String(body.slug).trim() : null;
  }
  if (body?.icon !== undefined) {
    patch.icon = body.icon ? String(body.icon).trim() : null;
  }
  if (body?.color !== undefined) {
    patch.color = body.color ? String(body.color).trim() : null;
  }

  if (body?.sortorder !== undefined) {
    const n = Number(body.sortorder);
    if (!Number.isFinite(n)) {
      return NextResponse.json(
        { error: 'sortorder inválido' },
        { status: 400 }
      );
    }
    patch.sortorder = n;
  }

  if (body?.isarchived !== undefined) {
    patch.isarchived = !!body.isarchived;
  }

  const { data, error } = await supabase
    .from('expense_categories')
    .update(patch)
    .eq('id', categoryId)
    .eq('divvyid', divvyId)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ category: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { divvyId: string; categoryId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, categoryId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', categoryId)
    .eq('divvyid', divvyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
