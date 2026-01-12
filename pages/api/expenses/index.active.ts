
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { sendExpenseNotificationEmail } from '../../../lib/email';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient();
  const { 
    divvyId, 
    paidByUserId, 
    amount, 
    category, 
    description, 
    date, 
    receiptPhotoUrl, 
    splits // Array of { participantuserid, amountowed }
  } = req.body;

  if (!divvyId || !amount || !category || !date || !splits || splits.length === 0) {
    return res.status(400).json({ error: 'Dados incompletos para criar despesa.' });
  }

  try {
    // 1. Inserir Despesa
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        divvyid: divvyId,
        paidbyuserid: paidByUserId,
        amount,
        category,
        description,
        date,
        receiptphotourl: receiptPhotoUrl,
        locked: false
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    // 2. Inserir Splits
    const splitsPayload = splits.map((s: any) => ({
      expenseid: expense.id,
      participantuserid: s.participantuserid,
      amountowed: s.amountowed
    }));

    const { error: splitError } = await supabase
      .from('expensesplits')
      .insert(splitsPayload);

    if (splitError) {
      // Rollback manual: deletar a despesa se os splits falharem
      await supabase.from('expenses').delete().eq('id', expense.id);
      throw splitError;
    }

    // 3. Notificações (Assíncrono)
    // Buscar nomes para o email
    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', divvyId).single();
    const { data: payer } = await supabase.from('userprofiles').select('displayname, fullname').eq('id', paidByUserId).single();
    const payerName = payer?.displayname || payer?.fullname || 'Alguém';

    // Identificar participantes que não são o pagador para notificar
    const participantsToNotify = splitsPayload
        .map((s: any) => s.participantuserid)
        .filter((uid: string) => uid !== paidByUserId);

    // Inserir notificações no banco
    const notifications = participantsToNotify.map((uid: string) => ({
        user_id: uid,
        divvy_id: divvyId,
        type: 'expense',
        title: 'Nova Despesa',
        message: `${payerName} adicionou: ${description} (R$ ${amount.toFixed(2)})`,
        created_at: new Date().toISOString(),
        is_read: false
    }));

    if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
    }

    // Enviar emails (apenas para quem tem email no profile e não é o pagador)
    const { data: usersToEmail } = await supabase
        .from('userprofiles')
        .select('email')
        .in('id', participantsToNotify);
    
    if (usersToEmail) {
        for (const user of usersToEmail) {
            if (user.email) {
                await sendExpenseNotificationEmail(
                    user.email, 
                    divvy?.name || 'Grupo', 
                    amount.toFixed(2), 
                    description, 
                    payerName
                );
            }
        }
    }

    return res.status(201).json({ expense });

  } catch (error: any) {
    console.error('Create Expense Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
