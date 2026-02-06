import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' }, { status: 401 });
  }

  const { data: memberships, error: memError } = await supabase
    .from('divvy_members')
    .select('divvyid, role, createdat')
    .eq('userid', user.id);

  if (memError) {
    return NextResponse.json({ ok: false, code: 'DB_ERROR', message: memError.message }, { status: 500 });
  }

  const ids = (memberships ?? []).map((m: any) => m.divvyid).filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ ok: true, groups: [] });
  }

  const { data: groups, error: groupsError } = await supabase
    .from('divvies')
    .select('id,name,type,creatorid,createdat,isarchived,endedat,description')
    .in('id', ids)
    .order('createdat', { ascending: false });

  if (groupsError) {
    return NextResponse.json({ ok: false, code: 'DB_ERROR', message: groupsError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, groups: groups ?? [] });
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const name = String(body?.name ?? body?.title ?? 'Novo grupo').trim() || 'Novo grupo';
  const type = String(body?.type ?? body?.kind ?? 'trip').trim() || 'trip';

  const { data: divvy, error: divvyError } = await supabase
    .from('divvies')
    .insert({ name, type, creatorid: user.id })
    .select('id,name,type,creatorid,createdat,isarchived,endedat,description')
    .maybeSingle();

  if (divvyError || !divvy) {
    return NextResponse.json({ ok: false, code: 'DB_ERROR', message: divvyError?.message || 'Failed to create group' }, { status: 500 });
  }

  // Ensure membership via RPC.
  const rpc = await supabase.rpc('ensure_divvy_membership', {
    p_divvy_id: divvy.id,
    p_role: 'admin',
    p_user_id: user.id,
  } as any);

  if (rpc.error) {
    // Fallback direct insert.
    const { error: memError } = await supabase
      .from('divvy_members')
      .insert({ divvyid: divvy.id, userid: user.id, role: 'admin' } as any);

    if (memError) {
      return NextResponse.json({ ok: false, code: 'DB_ERROR', message: memError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, group: divvy });
}
