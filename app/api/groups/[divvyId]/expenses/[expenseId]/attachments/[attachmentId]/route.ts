import { NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

export async function DELETE(
  _req: Request,
  { params }: { params: { divvyId: string; expenseId: string; attachmentId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, expenseId, attachmentId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: att } = await supabase
    .from('expense_attachments')
    .select('id, bucket, path')
    .eq('id', attachmentId)
    .eq('divvyid', divvyId)
    .eq('expenseid', expenseId)
    .single();

  const { error: delErr } = await supabase
    .from('expense_attachments')
    .delete()
    .eq('id', attachmentId)
    .eq('divvyid', divvyId)
    .eq('expenseid', expenseId);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  if (att?.bucket && att?.path) {
    await supabase.storage.from(att.bucket).remove([att.path]);
  }

  return NextResponse.json({ ok: true });
}
