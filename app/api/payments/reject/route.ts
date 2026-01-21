import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { sendPaymentRejectedEmail } from '@/lib/email';

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
      return NextResponse.json({ error: 'Apenas o recebedor pode rejeitar.' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: 'rejected',
        updatedat: new Date().toISOString(),
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
      title: 'Pagamento Recusado',
      message: `${creditorName} recusou seu registro de pagamento de R$ ${transaction.amount.toFixed(2)}.`,
      created_at: new Date().toISOString(),
      is_read: false,
    });

    if (debtor?.email) {
      await sendPaymentRejectedEmail(
        debtor.email,
        creditorName,
        transaction.amount.toFixed(2),
        divvy?.name || 'Grupo',
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
