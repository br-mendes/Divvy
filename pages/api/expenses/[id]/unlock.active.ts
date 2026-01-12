
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const expenseId = typeof id === 'string' ? id : '';

  try {
    // 1. Autenticar usuário
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();

    // 2. Buscar despesa e grupo para validar permissão
    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('divvyid, locked')
      .eq('id', expenseId)
      .single();

    if (fetchError || !expense) {
      return res.status(404).json({ error: 'Despesa não encontrada.' });
    }

    if (!expense.locked) {
      return res.status(400).json({ error: 'Despesa já está desbloqueada.' });
    }

    // 3. Verificar se o usuário é o criador do grupo
    const { data: divvy } = await supabase
      .from('divvies')
      .select('creatorid')
      .eq('id', expense.divvyid)
      .single();

    if (!divvy) {
      return res.status(404).json({ error: 'Grupo não encontrado.' });
    }

    if (divvy.creatorid !== user.id) {
      return res.status(403).json({ error: 'Apenas o criador do grupo pode desbloquear despesas.' });
    }

    // 4. Desbloquear
    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        locked: false,
        lockedreason: null,
        lockedat: null,
        updatedat: new Date().toISOString()
      })
      .eq('id', expenseId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });

  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
    console.error('Unlock Expense Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
