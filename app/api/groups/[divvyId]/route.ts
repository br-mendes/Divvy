import { NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const divvyId = params.divvyId;

  const { data: divvy, error: divvyErr } = await supabase
    .from('divvies')
    .select('*')
    .eq('id', divvyId)
    .single();

  if (divvyErr) return NextResponse.json({ error: divvyErr.message }, { status: 500 });

  const { data: members, error: memErr } = await supabase
    .from('divvymembers')
    .select('*')
    .eq('divvyid', divvyId)
    .order('joinedat', { ascending: true });

  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

  return NextResponse.json({ divvy, members });
}
