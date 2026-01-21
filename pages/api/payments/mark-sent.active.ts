
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { sendPaymentSentEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transactionId, fromUserId } = req.body;

  if (!transactionId || !fromUserId) {
    return res.status(400).json({ error: 'transactionId e fromUserId são obrigatórios.' });
  }

  try {
    // 1. Authenticate Request
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();

    // 2. Validate: The user marking as sent MUST be the one sending the money
    if (user.id !== fromUserId) {
        return res.status(403).json({ error: 'Você só pode registrar pagamentos que você enviou.' });
    }

    // 3. Fetch Transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (transactionError || !transaction) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Somente transações pendentes podem ser marcadas como enviadas.' });
    }

    if (transaction.fromuserid !== fromUserId) {
      return res.status(403).json({ error: 'Você só pode registrar pagamentos que você enviou.' });
    }

    const updatedAt = new Date().toISOString();
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'paymentsent',
        updatedat: updatedAt
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4. Fetch Notification Data
    const { data: creditor } = await supabase.from('userprofiles').select('email').eq('id', updatedTransaction.touserid).single();
    const { data: sender } = await supabase.from('userprofiles').select('fullname, displayname').eq('id', updatedTransaction.fromuserid).single();
    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', updatedTransaction.divvyid).single();

    const senderName = sender?.displayname || sender?.fullname || 'Alguém';
    
    // 5. Insert Notification
    await supabase.from('notifications').insert({
        user_id: updatedTransaction.touserid,
        divvy_id: updatedTransaction.divvyid,
        type: 'settlement',
        title: 'Pagamento Recebido',
        message: `${senderName} marcou um pagamento de R$ ${updatedTransaction.amount.toFixed(2)} como enviado.`,
        created_at: new Date().toISOString(),
        is_read: false
    });

    // 6. Send Email
    if (creditor?.email) {
        await sendPaymentSentEmail(
            creditor.email, 
            senderName, 
            updatedTransaction.amount.toFixed(2), 
            divvy?.name || 'Grupo'
        );
    }

    return res.status(200).json({ success: true, transaction: updatedTransaction });

  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Não autorizado' });
    console.error('Mark Sent Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
