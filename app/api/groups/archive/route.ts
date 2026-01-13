import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const { divvyId, userId } = await request.json();

    const { data: divvy } = await supabase.from('divvies').select('creatorid').eq('id', divvyId).single();

    if (!divvy) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    if (divvy.creatorid !== userId) return NextResponse.json({ error: 'Apenas o criador pode arquivar o grupo.' }, { status: 403 });

    const { error } = await supabase
      .from('divvies')
      .update({
        isarchived: true,
        endedat: new Date().toISOString(),
        archivesuggested: false,
      })
      .eq('id', divvyId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
