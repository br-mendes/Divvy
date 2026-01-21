import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';
import type { Divvy } from '@/types/divvy';

type DivvyMemberRow = {
  divvy: Divvy | null;
};

export async function GET() {
  const supabase = createServerSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Lista grupos onde usuário é membro (via view com join)
  const { data, error } = await supabase
    .from('divvymembers')
    .select('divvy:divvies(*)')
    .eq('userid', session.user.id)
    .order('joinedat', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const divvies = (data ?? [])
    .map((row) => (row as DivvyMemberRow).divvy)
    .filter((divvy): divvy is Divvy => Boolean(divvy));
  return NextResponse.json({ divvies });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const name = String(body?.name ?? '').trim();
  const description = body?.description ? String(body.description).trim() : null;
  const type = body?.type ?? 'other';

  if (!name) return NextResponse.json({ error: 'name é obrigatório' }, { status: 400 });

  // 1) cria grupo
  const { data: divvy, error: divvyErr } = await supabase
    .from('divvies')
    .insert({
      name,
      description,
      type,
      creatorid: session.user.id,
    })
    .select('*')
    .single();

  if (divvyErr) return NextResponse.json({ error: divvyErr.message }, { status: 500 });

  // 2) adiciona criador como admin e membro
  const { error: memberErr } = await supabase.from('divvymembers').insert({
    divvyid: divvy.id,
    userid: session.user.id,
    email: session.user.email ?? '',
    role: 'admin',
  });

  if (memberErr) {
    // rollback do grupo se falhar
    await supabase.from('divvies').delete().eq('id', divvy.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  return NextResponse.json({ divvy }, { status: 201 });
}
