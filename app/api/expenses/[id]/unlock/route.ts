import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const expenseId = params.id;

    const user = await authorizeUser(request);
    const supabase = createServerSupabaseClient();

    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('divvyid, locked')
      .eq('id', expenseId)
      .single();

    if (fetchError || !expense) {
      return NextResponse.json({ error: 'Despesa não encontrada.' }, { status: 404 });
    }

    if (!expense.locked) {
      return NextResponse.json({ error: 'Despesa já está desbloqueada.' }, { status: 400 });
    }

    const { data: divvy } = await supabase
      .from('divvies')
      .select('creatorid')
      .eq('id', expense.divvyid)
      .single();

    if (!divvy) {
      return NextResponse.json({ error: 'Grupo não encontrado.' }, { status: 404 });
    }

    if (divvy.creatorid !== user.id) {
      return NextResponse.json({ error: 'Apenas o criador do grupo pode desbloquear despesas.' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        locked: false,
        lockedreason: null,
        lockedat: null,
        updatedat: new Date().toISOString(),
      })
      .eq('id', expenseId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
    }
    console.error('Unlock Expense Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
