import { NextRequest, NextResponse } from 'next/server';

import { isSystemAdminEmail } from '@/lib/auth/admin';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { divvyId: string; requestId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, requestId } = params;

  const { decision, note } = await req.json(); // decision: 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) {
    return NextResponse.json({ error: 'decision inválida' }, { status: 400 });
  }

  const { session, role, isCreator } = await getMyRoleInDivvy(divvyId);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSystemAdmin = isSystemAdminEmail(session.user.email);
  const canDecide = isSystemAdmin || isCreator || role === 'admin';
  if (!canDecide) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Busca request
  const { data: reqRow, error: readErr } = await supabase
    .from('divvymember_removal_requests')
    .select('*')
    .eq('id', requestId)
    .eq('divvyid', divvyId)
    .single();

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  if (reqRow.status !== 'pending') {
    return NextResponse.json({ error: 'Request já foi decidido' }, { status: 400 });
  }

  // Atualiza request com decisão
  const { error: updErr } = await supabase
    .from('divvymember_removal_requests')
    .update({
      status: decision,
      decidedat: new Date().toISOString(),
      decidedby: session.user.id,
      decisionnote: note ? String(note).trim() : null,
    })
    .eq('id', requestId);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Se aprovado -> remove membro
  if (decision === 'approved') {
    // opcional: evitar remover criador
    const { data: divvy } = await supabase
      .from('divvies')
      .select('creatorid')
      .eq('id', divvyId)
      .single();
    if (divvy?.creatorid === reqRow.targetuserid) {
      return NextResponse.json({ error: 'Não é permitido remover o criador do grupo.' }, { status: 400 });
    }

    const { error: delErr } = await supabase
      .from('divvymembers')
      .delete()
      .eq('divvyid', divvyId)
      .eq('userid', reqRow.targetuserid);

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, decision });
}
