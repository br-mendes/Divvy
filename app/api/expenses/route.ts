import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';
import { sendExpenseNotificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const {
      divvyId,
      paidByUserId,
      amount,
      category,
      description,
      date,
      receiptPhotoUrl,
      splits,
    } = await request.json();

    if (!divvyId || !amount || !category || !date || !splits || splits.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos para criar despesa.' }, { status: 400 });
    }

    const user = await authorizeUser(request);
    const supabase = createServerSupabaseClient();

    const { data: membership } = await supabase
      .from('divvymembers')
      .select('id')
      .eq('divvyid', divvyId)
      .eq('userid', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Você não é membro deste grupo.' }, { status: 403 });
    }

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
        locked: false,
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    const splitsPayload = splits.map((s: any) => ({
      expenseid: expense.id,
      participantuserid: s.participantuserid,
      amountowed: s.amountowed,
    }));

    const { error: splitError } = await supabase
      .from('expensesplits')
      .insert(splitsPayload);

    if (splitError) {
      await supabase.from('expenses').delete().eq('id', expense.id);
      throw splitError;
    }

    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', divvyId).single();
    const { data: payer } = await supabase.from('userprofiles').select('displayname, fullname').eq('id', paidByUserId).single();
    const payerName = payer?.displayname || payer?.fullname || 'Alguém';

    const participantsToNotify = splitsPayload
      .map((s: any) => s.participantuserid)
      .filter((uid: string) => uid !== paidByUserId);

    const notifications = participantsToNotify.map((uid: string) => ({
      user_id: uid,
      divvy_id: divvyId,
      type: 'expense',
      title: 'Nova Despesa',
      message: `${payerName} adicionou: ${description} (R$ ${amount.toFixed(2)})`,
      created_at: new Date().toISOString(),
      is_read: false,
    }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    const { data: usersToEmail } = await supabase
      .from('userprofiles')
      .select('email')
      .in('id', participantsToNotify);

    if (usersToEmail) {
      for (const u of usersToEmail) {
        if (u.email) {
          await sendExpenseNotificationEmail(
            u.email,
            divvy?.name || 'Grupo',
            amount.toFixed(2),
            description,
            payerName,
          );
        }
      }
    }

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('Create Expense Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
