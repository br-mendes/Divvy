import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const expenseId = params.id;
    const supabase = createServerSupabaseClient();

    const { data: expense } = await supabase.from('expenses').select('locked').eq('id', expenseId).single();

    if (expense?.locked) {
      return NextResponse.json({ error: 'Despesa bloqueada não pode ser excluída.' }, { status: 403 });
    }

    await supabase.from('expensesplits').delete().eq('expenseid', expenseId);

    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const expenseId = params.id;
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

    const supabase = createServerSupabaseClient();

    const { data: expense } = await supabase.from('expenses').select('locked').eq('id', expenseId).single();
    if (expense?.locked) {
      return NextResponse.json({ error: 'Despesa bloqueada não pode ser editada.' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('expenses')
      .update({
        divvyid: divvyId,
        paidbyuserid: paidByUserId,
        amount,
        category,
        description,
        date,
        receiptphotourl: receiptPhotoUrl,
        updatedat: new Date().toISOString(),
      })
      .eq('id', expenseId);

    if (updateError) throw updateError;

    await supabase.from('expensesplits').delete().eq('expenseid', expenseId);

    const splitsPayload = splits.map((s: any) => ({
      expenseid: expenseId,
      participantuserid: s.participantuserid,
      amountowed: s.amountowed,
    }));

    const { error: splitError } = await supabase
      .from('expensesplits')
      .insert(splitsPayload);

    if (splitError) throw splitError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
