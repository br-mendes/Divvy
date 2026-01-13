
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';
import { authorizeUser } from '../../../../lib/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const divvyId = typeof id === 'string' ? id : '';

  if (!divvyId) return res.status(400).json({ error: 'ID do grupo obrigatório' });

  try {
    // 1. Validar Token do Usuário
    const user = await authorizeUser(req, res);
    
    // 2. Usar Service Role para bypassar RLS
    const supabase = createServerSupabaseClient(); 

    // 3. Verificar se o usuário é membro deste grupo
    const { data: membership, error: memError } = await supabase
        .from('divvymembers')
        .select('*')
        .eq('divvyid', divvyId)
        .eq('userid', user.id)
        .single();

    if (memError || !membership) {
        return res.status(403).json({ error: 'Você não tem permissão para acessar este grupo.' });
    }

    // 4. Buscar dados do grupo em paralelo
    const [divvyRes, membersRes, expensesRes, transactionsRes] = await Promise.all([
        supabase.from('divvies').select('*').eq('id', divvyId).single(),
        supabase.from('divvymembers').select('*, userprofiles (*)').eq('divvyid', divvyId),
        supabase.from('expenses').select('*').eq('divvyid', divvyId).order('date', { ascending: false }),
        supabase.from('transactions').select('*').eq('divvyid', divvyId).order('createdat', { ascending: false })
    ]);

    if (divvyRes.error) throw divvyRes.error;

    // Processar membros para garantir estrutura correta
    const processedMembers = (membersRes.data || []).map((m: any) => ({
        ...m,
        // Normaliza userprofiles se vier como array
        userprofiles: Array.isArray(m.userprofiles) ? m.userprofiles[0] : m.userprofiles
    }));

    // Buscar Splits para as despesas carregadas
    let splits: any[] = [];
    if (expensesRes.data && expensesRes.data.length > 0) {
        const expenseIds = expensesRes.data.map(e => e.id);
        const { data: splitData } = await supabase
            .from('expensesplits')
            .select('*')
            .in('expenseid', expenseIds);
        splits = splitData || [];
    }

    return res.status(200).json({
        divvy: divvyRes.data,
        members: processedMembers,
        expenses: expensesRes.data || [],
        transactions: transactionsRes.data || [],
        splits: splits
    });

  } catch (error: any) {
    console.error('Group Details API Error:', error);
    return res.status(500).json({ error: error.message || 'Falha ao carregar grupo' });
  }
}
