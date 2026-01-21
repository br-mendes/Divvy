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

  // Ler request via RLS (admin/criador do grupo enxerga; system admin vai usar service abaixo)
  const { data: reqRow, error: rErr } = await supabase
    .from('divvy_action_requests')
    .select('*')
    .eq('id', requestId)
    .eq('divvyid', divvyId)
    .single();

  const systemAdmin = isSystemAdminEmail(session.user.email);

  const svc = systemAdmin ? createServiceSupabase() : null;

  const request =
    reqRow ??
    (systemAdmin
      ? (
          await svc!
            .from('divvy_action_requests')
            .select('*')
            .eq('id', requestId)
            .eq('divvyid', divvyId)
            .single()
        ).data
      : null);

  if (!request) return NextResponse.json({ error: rErr?.message ?? 'Not found' }, { status: 404 });
  if (request.status !== 'pending')
    return NextResponse.json({ error: 'Request já foi decidido.' }, { status: 409 });

  // Remover membro
  const remover = systemAdmin ? svc! : supabase;

  const { error: delErr } = await remover
    .from('divvymembers')
    .delete()
    .eq('divvyid', divvyId)
    .eq('userid', request.target_userid);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  const { error: upErr } = await remover
    .from('divvy_action_requests')
    .update({
      status: 'approved',
      decided_by: session.user.id,
      decided_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('divvyid', divvyId);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
