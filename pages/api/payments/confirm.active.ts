
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { sendPaymentConfirmedEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient();
  const { transactionId, userId } = req.body;

  try {
    const user = await authorizeUser(req, res);

    if (userId && user.id !== userId) {
        return res.status(403).json({ error: 'Usuário inválido para confirmar pagamento.' });
    }

    // 1. Buscar transação
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) throw new Error('Transação não encontrada');

    // Validar que quem confirma é o credor (touserid)
    // Nota: Em produção, verificaríamos o JWT do req para garantir que 'userId' é quem diz ser.
    if (transaction.touserid !== user.id) {
        return res.status(403).json({ error: 'Apenas o recebedor pode confirmar.' });
    }

    // 2. Atualizar Transação
    const paidAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'confirmed',
        paidat: paidAt,
        updatedat: paidAt
      })
      .eq('id', transactionId);

    if (updateError) throw updateError;

    // 3. Notificar Devedor
    const { data: debtor } = await supabase.from('userprofiles').select('email').eq('id', transaction.fromuserid).single();
    const { data: creditor } = await supabase.from('userprofiles').select('fullname, displayname').eq('id', transaction.touserid).single();
    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', transaction.divvyid).single();
    const creditorName = creditor?.displayname || creditor?.fullname || 'Credor';

    await supabase.from('notifications').insert({
        user_id: transaction.fromuserid,
        divvy_id: transaction.divvyid,
        type: 'settlement',
        title: 'Pagamento Confirmado',
        message: `${creditorName} confirmou seu pagamento de R$ ${transaction.amount.toFixed(2)}.`,
        created_at: new Date().toISOString(),
        is_read: false
    });

    if (debtor?.email) {
        await sendPaymentConfirmedEmail(
            debtor.email,
            creditorName,
            transaction.amount.toFixed(2),
            divvy?.name || 'Grupo'
        );
    }

    // 4. Regra de Negócio: Fechamento de Caixa Global
    // Se TODAS as transações deste grupo estiverem 'confirmed' ou 'rejected' (resolvidas)
    // Então bloqueamos despesas antigas.
    
    const { data: allTransactions } = await supabase
        .from('transactions')
        .select('status, paidat')
        .eq('divvyid', transaction.divvyid);
    
    const allResolved = allTransactions?.every(t => 
        t.status === 'confirmed' || t.status === 'rejected'
    );

    if (allResolved && allTransactions && allTransactions.length > 0) {
        // Encontrar a data mais recente de pagamento confirmado
        // Consideramos também o pagamento atual que acabamos de confirmar (paidAt)
        const dates = allTransactions
            .filter(t => t.status === 'confirmed')
            .map(t => new Date(t.paidat).getTime());
        
        // Incluir a data atual se não estiver na lista (delay de replicação)
        dates.push(new Date(paidAt).getTime());
        
        const maxDateTimestamp = Math.max(...dates);
        const maxDateISO = new Date(maxDateTimestamp).toISOString();

        // Atualizar Divvy
        await supabase.from('divvies').update({
            lastglobalconfirmationat: maxDateISO,
            archivesuggested: true,
            archivesuggestedat: new Date().toISOString()
        }).eq('id', transaction.divvyid);

        // Bloquear despesas anteriores
        await supabase.from('expenses')
            .update({
                locked: true,
                lockedreason: 'Bloqueio automático: Todas as dívidas quitadas.',
                lockedat: new Date().toISOString()
            })
            .eq('divvyid', transaction.divvyid)
            .lte('date', maxDateISO) // Data da despesa <= Último pagamento
            .eq('locked', false);
            
        console.log(`[Divvy ${transaction.divvyid}] Fechamento de caixa realizado em ${maxDateISO}`);
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Confirm Payment Error:', error);
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Não autorizado' });
    return res.status(500).json({ error: error.message });
  }
}
