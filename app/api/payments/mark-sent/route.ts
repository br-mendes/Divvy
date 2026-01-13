import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';
import { sendPaymentSentEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { divvyId, fromUserId, toUserId, amount } = await request.json();

    const user = await authorizeUser(request);
    const supabase = createServerSupabaseClient();

    if (user.id !== fromUserId) {
      return NextResponse.json({ error: 'Você só pode registrar pagamentos que você enviou.' }, { status: 403 });
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        divvyid: divvyId,
        fromuserid: fromUserId,
        touserid: toUserId,
        amount: amount,
        status: 'paymentsent',
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const { data: creditor } = await supabase.from('userprofiles').select('email').eq('id', toUserId).single();
    const { data: sender } = await supabase.from('userprofiles').select('fullname, displayname').eq('id', fromUserId).single();
    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', divvyId).single();

    const senderName = sender?.displayname || sender?.fullname || 'Alguém';

    await supabase.from('notifications').insert({
      user_id: toUserId,
      divvy_id: divvyId,
      type: 'settlement',
      title: 'Pagamento Recebido',
      message: `${senderName} marcou um pagamento de R$ ${amount.toFixed(2)} como enviado.`,
      created_at: new Date().toISOString(),
      is_read: false,
    });

    if (creditor?.email) {
      await sendPaymentSentEmail(
        creditor.email,
        senderName,
        amount.toFixed(2),
        divvy?.name || 'Grupo',
      );
    }

    return NextResponse.json({ success: true, transaction }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    console.error('Mark Sent Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
