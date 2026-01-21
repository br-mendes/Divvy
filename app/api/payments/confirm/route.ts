import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { sendPaymentConfirmedEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { transactionId, userId } = await request.json();

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) throw new Error('Transação não encontrada');

    if (transaction.touserid !== userId) {
      return NextResponse.json({ error: 'Apenas o recebedor pode confirmar.' }, { status: 403 });
    }

    const paidAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'confirmed',
        paidat: paidAt,
        updatedat: paidAt,
      })
      .eq('id', transactionId);

    if (updateError) throw updateError;

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
      is_read: false,
    });

    if (debtor?.email) {
      await sendPaymentConfirmedEmail(
        debtor.email,
        creditorName,
        transaction.amount.toFixed(2),
        divvy?.name || 'Grupo',
      );
    }

    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('status, paidat')
      .eq('divvyid', transaction.divvyid);

    const allResolved = allTransactions?.every(t =>
      t.status === 'confirmed' || t.status === 'rejected',
    );

    if (allResolved && allTransactions && allTransactions.length > 0) {
      const dates = allTransactions
        .filter(t => t.status === 'confirmed')
        .map(t => new Date(t.paidat).getTime());

      dates.push(new Date(paidAt).getTime());

      const maxDateTimestamp = Math.max(...dates);
      const maxDateISO = new Date(maxDateTimestamp).toISOString();

      await supabase.from('divvies').update({
        lastglobalconfirmationat: maxDateISO,
        archivesuggested: true,
        archivesuggestedat: new Date().toISOString(),
      }).eq('id', transaction.divvyid);

      await supabase.from('expenses')
        .update({
          locked: true,
          lockedreason: 'Bloqueio automático: Todas as dívidas quitadas.',
          lockedat: new Date().toISOString(),
        })
        .eq('divvyid', transaction.divvyid)
        .lte('date', maxDateISO)
        .eq('locked', false);

      console.log(`[Divvy ${transaction.divvyid}] Fechamento de caixa realizado em ${maxDateISO}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Confirm Payment Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
