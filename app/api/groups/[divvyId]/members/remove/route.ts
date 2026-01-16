import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const divvyId = params.divvyId;
  const { userIdToRemove } = await req.json();

  if (!userIdToRemove) {
    return NextResponse.json({ error: 'userIdToRemove é obrigatório' }, { status: 400 });
  }

  // Apenas criador pode remover (pela policy no banco).
  const { error } = await supabase
    .from('divvymembers')
    .delete()
    .eq('divvyid', divvyId)
    .eq('userid', userIdToRemove);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
