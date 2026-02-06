import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

function jsonError(status: number, code: string, message: string, extra?: any) {
  return NextResponse.json({ ok: false, code, message, ...(extra ?? {}) }, { status });
}

function mapRow(r: any) {
  return {
    id: String(r?.id ?? ''),
    bucket: String(r?.storage_bucket ?? 'expense-attachments'),
    path: String(r?.storage_path ?? ''),
    filename: (r?.file_name ?? null) as string | null,
    mimetype: (r?.content_type ?? null) as string | null,
    sizebytes: (r?.byte_size ?? null) as number | null,
    createdat: String(r?.created_at ?? ''),
  };
}

export async function GET(_req: Request, ctx: { params: { divvyId: string; expenseId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return jsonError(401, 'UNAUTHENTICATED', 'You must be logged in');
  }

  const divvyId = ctx.params.divvyId;
  const expenseId = ctx.params.expenseId;
  if (!divvyId || !expenseId) {
    return jsonError(400, 'BAD_REQUEST', 'Missing divvyId/expenseId');
  }

  const { data, error } = await supabase
    .from('expense_attachments')
    .select('id,storage_bucket,storage_path,file_name,content_type,byte_size,created_at')
    .eq('divvy_id', divvyId)
    .eq('expense_id', expenseId)
    .order('created_at', { ascending: false });

  if (error) {
    return jsonError(500, 'DB_ERROR', error.message, { where: 'expense_attachments_list' });
  }

  return NextResponse.json({ ok: true, attachments: (data ?? []).map(mapRow) });
}

export async function POST(req: Request, ctx: { params: { divvyId: string; expenseId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) {
    return jsonError(401, 'UNAUTHENTICATED', 'You must be logged in');
  }

  const divvyId = ctx.params.divvyId;
  const expenseId = ctx.params.expenseId;
  if (!divvyId || !expenseId) {
    return jsonError(400, 'BAD_REQUEST', 'Missing divvyId/expenseId');
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const bucket = asString(body?.bucket) || 'expense-attachments';
  const path = asString(body?.path);
  const filename = (asString(body?.filename) || null) as string | null;
  const mimetype = (asString(body?.mimetype) || null) as string | null;
  const sizebytesRaw = body?.sizebytes;
  const sizebytes = typeof sizebytesRaw === 'number' && Number.isFinite(sizebytesRaw) ? sizebytesRaw : null;

  if (!path) {
    return jsonError(400, 'BAD_REQUEST', 'Missing path');
  }
  if (bucket !== 'expense-attachments') {
    return jsonError(400, 'BAD_REQUEST', 'Invalid bucket');
  }
  const prefix = `${divvyId}/${expenseId}/`;
  if (!path.startsWith(prefix)) {
    return jsonError(400, 'BAD_REQUEST', `Invalid path; must start with ${prefix}`);
  }

  const { data, error } = await supabase
    .from('expense_attachments')
    .insert({
      divvy_id: divvyId,
      expense_id: expenseId,
      storage_bucket: bucket,
      storage_path: path,
      file_name: filename,
      content_type: mimetype,
      byte_size: sizebytes,
      created_by: auth.user.id,
    } as any)
    .select('id,storage_bucket,storage_path,file_name,content_type,byte_size,created_at')
    .single();

  if (error) {
    return jsonError(500, 'DB_ERROR', error.message, { where: 'expense_attachments_insert' });
  }

  return NextResponse.json({ ok: true, attachment: mapRow(data) }, { status: 201 });
}
