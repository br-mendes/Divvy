import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const { divvyId, userId } = await request.json();

    const { data: member } = await supabase
      .from('divvymembers')
      .select('id')
      .eq('divvyid', divvyId)
      .eq('userid', userId)
      .single();

    if (!member) return NextResponse.json({ error: 'Você não é membro deste grupo.' }, { status: 403 });

    const { error } = await supabase
      .from('divvies')
      .update({ archivesuggested: false })
      .eq('id', divvyId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
