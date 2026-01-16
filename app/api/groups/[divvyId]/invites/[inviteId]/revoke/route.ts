import { NextResponse } from 'next/server';

import { isSystemAdminEmail } from '@/lib/auth/admin';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(
  _req: Request,
  { params }: { params: { divvyId: string; inviteId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, inviteId } = params;

  const { session, role, isCreator } = await getMyRoleInDivvy(divvyId);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSystemAdmin = isSystemAdminEmail(session.user.email);
  const canManage = isSystemAdmin || isCreator || role === 'admin';
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // só revoga se ainda estiver pendente
  const { data: invite, error: readErr } = await supabase
    .from('divvyinvites')
    .select('id, status')
    .eq('id', inviteId)
    .eq('divvyid', divvyId)
    .single();

  if (readErr || !invite) {
    return NextResponse.json({ error: 'Invite não encontrado' }, { status: 404 });
  }
  if (invite.status !== 'pending') {
    return NextResponse.json(
      { error: 'Apenas convites pendentes podem ser revogados' },
      { status: 400 }
    );
  }

  const { error: updErr } = await supabase
    .from('divvyinvites')
    .update({ status: 'revoked' })
    .eq('id', inviteId);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
