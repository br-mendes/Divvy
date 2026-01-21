import { NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
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

  const { data: att, error: attErr } = await supabase
    .from('expense_attachments')
    .select('id, bucket, path')
    .eq('id', attachmentId)
    .eq('divvyid', divvyId)
    .eq('expenseid', expenseId)
    .single();

  if (attErr || !att) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(att.bucket)
    .createSignedUrl(att.path, 60);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ url: data?.signedUrl });
}
