
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { sendPaymentRejectedEmail } from '../../../lib/email';
import { authorizeUser } from '../../../lib/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createServerSupabaseClient();
  const { transactionId } = req.body;

  try {
    const user = await authorizeUser(req, res);

    if (userId && user.id !== userId) {
        return res.status(403).json({ error: 'Usuário inválido para rejeitar pagamento.' });
    }

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) throw new Error('Transação não encontrada');

    if (transaction.touserid !== user.id) {
        return res.status(403).json({ error: 'Apenas o recebedor pode rejeitar.' });
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'rejected',
        updatedat: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateError) throw updateError;

    // Notificar
    const { data: debtor } = await supabase.from('userprofiles').select('email').eq('id', transaction.fromuserid).single();
    const { data: creditor } = await supabase.from('userprofiles').select('fullname, displayname').eq('id', transaction.touserid).single();
    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', transaction.divvyid).single();
    const creditorName = creditor?.displayname || creditor?.fullname || 'Credor';

    await supabase.from('notifications').insert({
        user_id: transaction.fromuserid,
        divvy_id: transaction.divvyid,
        type: 'settlement',
        title: 'Pagamento Recusado',
        message: `${creditorName} recusou seu registro de pagamento de R$ ${transaction.amount.toFixed(2)}.`,
        created_at: new Date().toISOString(),
        is_read: false
    });

    if (debtor?.email) {
        await sendPaymentRejectedEmail(
            debtor.email,
            creditorName,
            transaction.amount.toFixed(2),
            divvy?.name || 'Grupo'
        );
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Não autorizado' });
    return res.status(500).json({ error: error.message });
  }
}
