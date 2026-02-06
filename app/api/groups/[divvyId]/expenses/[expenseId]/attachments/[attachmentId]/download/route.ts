import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string, message: string, extra?: any) {
  return NextResponse.json({ ok: false, code, message, ...(extra ?? {}) }, { status });
}

export async function GET(
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
    .select('id,storage_bucket,storage_path')
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
  if (!bucket || !path) {
    return jsonError(500, 'DB_ERROR', 'Attachment row missing bucket/path');
  }

  const expiresIn = 60 * 5;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    return jsonError(500, 'STORAGE_ERROR', error?.message ?? 'Failed to sign URL');
  }

  return NextResponse.json({ ok: true, url: data.signedUrl, expiresIn });
}
