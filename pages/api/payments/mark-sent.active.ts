
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { sendPaymentSentEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { divvyId, fromUserId, toUserId, amount } = req.body;

  try {
    // 1. Authenticate Request
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();

    // 2. Validate: The user marking as sent MUST be the one sending the money
    if (user.id !== fromUserId) {
        return res.status(403).json({ error: 'Você só pode registrar pagamentos que você enviou.' });
    }

    // 3. Create Transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        divvyid: divvyId,
        fromuserid: fromUserId,
        touserid: toUserId,
        amount: amount,
        status: 'paymentsent',
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // 4. Fetch Notification Data
    const { data: creditor } = await supabase.from('userprofiles').select('email').eq('id', toUserId).single();
    const { data: sender } = await supabase.from('userprofiles').select('fullname, displayname').eq('id', fromUserId).single();
    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', divvyId).single();

    const senderName = sender?.displayname || sender?.fullname || 'Alguém';
    
    // 5. Insert Notification
    await supabase.from('notifications').insert({
        user_id: toUserId,
        divvy_id: divvyId,
        type: 'settlement',
        title: 'Pagamento Recebido',
        message: `${senderName} marcou um pagamento de R$ ${amount.toFixed(2)} como enviado.`,
        created_at: new Date().toISOString(),
        is_read: false
    });

    // 6. Send Email
    if (creditor?.email) {
        await sendPaymentSentEmail(
            creditor.email, 
            senderName, 
            amount.toFixed(2), 
            divvy?.name || 'Grupo'
        );
    }

    return res.status(200).json({ success: true, transaction });

  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Não autorizado' });
    console.error('Mark Sent Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
