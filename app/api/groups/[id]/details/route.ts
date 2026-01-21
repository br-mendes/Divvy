import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const divvyId = params.id;

  if (!divvyId) return NextResponse.json({ error: 'ID do grupo obrigatório' }, { status: 400 });

  try {
    const user = await authorizeUser(request);
    const supabase = createServerSupabaseClient();

    const { data: membership, error: memError } = await supabase
      .from('divvymembers')
      .select('*')
      .eq('divvyid', divvyId)
      .eq('userid', user.id)
      .single();

    if (memError || !membership) {
      return NextResponse.json({ error: 'Você não tem permissão para acessar este grupo.' }, { status: 403 });
    }

    const [divvyRes, membersRes, expensesRes, transactionsRes] = await Promise.all([
      supabase.from('divvies').select('*').eq('id', divvyId).single(),
      supabase.from('divvymembers').select('*, userprofiles (*)').eq('divvyid', divvyId),
      supabase.from('expenses').select('*').eq('divvyid', divvyId).order('date', { ascending: false }),
      supabase.from('transactions').select('*').eq('divvyid', divvyId).order('createdat', { ascending: false }),
    ]);

    if (divvyRes.error) throw divvyRes.error;

    const processedMembers = (membersRes.data || []).map((m: any) => ({
      ...m,
      userprofiles: Array.isArray(m.userprofiles) ? m.userprofiles[0] : m.userprofiles,
    }));

    let splits: any[] = [];
    if (expensesRes.data && expensesRes.data.length > 0) {
      const expenseIds = expensesRes.data.map(e => e.id);
      const { data: splitData } = await supabase
        .from('expensesplits')
        .select('*')
        .in('expenseid', expenseIds);
      splits = splitData || [];
    }

    return NextResponse.json({
      divvy: divvyRes.data,
      members: processedMembers,
      expenses: expensesRes.data || [],
      transactions: transactionsRes.data || [],
      splits,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Group Details API Error:', error);
    return NextResponse.json({ error: error.message || 'Falha ao carregar grupo' }, { status: 500 });
  }
}
