import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string, message: string, extra?: any) {
  return NextResponse.json({ ok: false, code, message, ...(extra ?? {}) }, { status });
}

export async function DELETE(
  _req: Request,
  ctx: { params: { divvyId: string; expenseId: string; attachmentId: string } }
) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return jsonError(401, 'UNAUTHENTICATED', 'You must be logged in');
  }

  const { divvyId, expenseId, attachmentId } = ctx.params;
  if (!divvyId || !expenseId || !attachmentId) {
    return jsonError(400, 'BAD_REQUEST', 'Missing params');
  }

  const { data: row, error: readErr } = await supabase
    .from('expense_attachments')
    .select('id,divvy_id,expense_id,storage_bucket,storage_path')
    .eq('id', attachmentId)
    .eq('divvy_id', divvyId)
    .eq('expense_id', expenseId)
    .maybeSingle();

  if (readErr) {
    return jsonError(500, 'DB_ERROR', readErr.message, { where: 'expense_attachments_get' });
  }
  if (!row) {
    return jsonError(404, 'NOT_FOUND', 'Attachment not found');
  }

  const bucket = String((row as any).storage_bucket ?? 'expense-attachments');
  const path = String((row as any).storage_path ?? '');

  if (bucket && path) {
    const { error: storageErr } = await supabase.storage.from(bucket).remove([path]);
    if (storageErr) {
      return jsonError(500, 'STORAGE_ERROR', storageErr.message, { where: 'storage_remove' });
    }
  }

  const { error: delErr } = await supabase.from('expense_attachments').delete().eq('id', attachmentId);
  if (delErr) {
    return jsonError(500, 'DB_ERROR', delErr.message, { where: 'expense_attachments_delete' });
  }

  return NextResponse.json({ ok: true });
}
