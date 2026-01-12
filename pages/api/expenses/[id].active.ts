
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const expenseId = typeof id === 'string' ? id : '';
  const supabase = createServerSupabaseClient();

  if (req.method === 'DELETE') {
    try {
      // Verificar se está bloqueada antes de deletar
      const { data: expense } = await supabase.from('expenses').select('locked').eq('id', expenseId).single();
      
      if (expense?.locked) {
        return res.status(403).json({ error: 'Despesa bloqueada não pode ser excluída.' });
      }

      // Deletar splits primeiro (embora CASCADE possa resolver, explícito é mais seguro via API)
      await supabase.from('expensesplits').delete().eq('expenseid', expenseId);
      
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    const { 
        divvyId,
        paidByUserId, 
        amount, 
        category, 
        description, 
        date, 
        receiptPhotoUrl, 
        splits 
    } = req.body;

    try {
      // Verificar bloqueio
      const { data: expense } = await supabase.from('expenses').select('locked').eq('id', expenseId).single();
      if (expense?.locked) {
        return res.status(403).json({ error: 'Despesa bloqueada não pode ser editada.' });
      }

      // 1. Atualizar Despesa
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          divvyid: divvyId,
          paidbyuserid: paidByUserId,
          amount,
          category,
          description,
          date,
          receiptphotourl: receiptPhotoUrl,
          updatedat: new Date().toISOString()
        })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      // 2. Substituir Splits (Delete + Insert)
      // Isso é mais simples do que tentar fazer diff/patch dos splits
      await supabase.from('expensesplits').delete().eq('expenseid', expenseId);

      const splitsPayload = splits.map((s: any) => ({
        expenseid: expenseId,
        participantuserid: s.participantuserid,
        amountowed: s.amountowed
      }));

      const { error: splitError } = await supabase
        .from('expensesplits')
        .insert(splitsPayload);

      if (splitError) throw splitError;

      return res.status(200).json({ success: true });

    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
