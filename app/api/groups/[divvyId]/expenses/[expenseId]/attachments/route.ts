import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: { divvyId: string; expenseId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, expenseId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('expense_attachments')
    .select(
      'id, divvyid, expenseid, uploadedbyuserid, bucket, path, filename, mimetype, sizebytes, createdat'
    )
    .eq('divvyid', divvyId)
    .eq('expenseid', expenseId)
    .order('createdat', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ attachments: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { divvyId: string; expenseId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, expenseId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const bucket = String(body?.bucket ?? 'receipts');
  const path = String(body?.path ?? '').trim();
  const filename = body?.filename ? String(body.filename).trim() : null;
  const mimetype = body?.mimetype ? String(body.mimetype).trim() : null;
  const sizebytes = Number.isFinite(Number(body?.sizebytes))
    ? Number(body.sizebytes)
    : null;

  if (!path) {
    return NextResponse.json({ error: 'path é obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('expense_attachments')
    .insert({
      divvyid: divvyId,
      expenseid: expenseId,
      uploadedbyuserid: session.user.id,
      bucket,
      path,
      filename,
      mimetype,
      sizebytes,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ attachment: data }, { status: 201 });
}
