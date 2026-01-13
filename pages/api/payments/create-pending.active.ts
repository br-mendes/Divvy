import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { divvyId, fromUserId, toUserId, amount } = req.body;

  if (!divvyId || !fromUserId || !toUserId || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Dados obrigatórios ausentes.' });
  }

  try {
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();

    if (user.id !== fromUserId) {
      return res.status(403).json({ error: 'Você só pode registrar pagamentos que você enviou.' });
    }

    const { data: activeTransactions, error: activeError } = await supabase
      .from('transactions')
      .select('*')
      .eq('divvyid', divvyId)
      .eq('fromuserid', fromUserId)
      .eq('touserid', toUserId)
      .in('status', ['pending', 'paymentsent'])
      .order('createdat', { ascending: false })
      .limit(1);

    if (activeError) throw activeError;

    if (activeTransactions && activeTransactions.length > 0) {
      const existing = activeTransactions[0];
      if (existing.status === 'paymentsent') {
        return res.status(409).json({ error: 'Pagamento já registrado como enviado.' });
      }
      return res.status(200).json({ transaction: existing, existing: true });
    }

    const now = new Date().toISOString();
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        divvyid: divvyId,
        fromuserid: fromUserId,
        touserid: toUserId,
        amount,
        status: 'pending',
        createdat: now,
        updatedat: now
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ transaction });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Não autorizado' });
    console.error('Create Pending Payment Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
