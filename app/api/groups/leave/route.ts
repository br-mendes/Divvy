import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const { divvyId, userId } = await request.json();

    if (!divvyId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: divvy } = await supabase.from('divvies').select('creatorid').eq('id', divvyId).single();

    if (!divvy) return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });

    if (divvy.creatorid === userId) {
      return NextResponse.json({ error: 'O criador não pode sair do grupo. Você pode arquivá-lo ou excluí-lo.' }, { status: 403 });
    }

    const { error } = await supabase
      .from('divvymembers')
      .delete()
      .eq('divvyid', divvyId)
      .eq('userid', userId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
