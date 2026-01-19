import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { isSystemAdminEmail } from '@/lib/auth/admin';
import { createServiceSupabase } from '@/lib/supabase/service';

export async function POST(
  _req: Request,
  { params }: { params: { divvyId: string; requestId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, requestId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const systemAdmin = isSystemAdminEmail(session.user.email);
  const db = systemAdmin ? createServiceSupabase() : supabase;

  const { data: reqRow, error } = await db
    .from('divvy_action_requests')
    .select('*')
    .eq('id', requestId)
    .eq('divvyid', divvyId)
    .single();

  if (error || !reqRow)
    return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 });
  if (reqRow.status !== 'pending')
    return NextResponse.json({ error: 'Request já foi decidido.' }, { status: 409 });

  const { error: upErr } = await db
    .from('divvy_action_requests')
    .update({
      status: 'rejected',
      decided_by: session.user.id,
      decided_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('divvyid', divvyId);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
