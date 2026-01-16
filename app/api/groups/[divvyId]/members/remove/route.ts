import { NextRequest, NextResponse } from 'next/server';

import { isSystemAdminEmail } from '@/lib/auth/admin';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  const { userIdToRemove, reason } = await req.json();

  if (!userIdToRemove) {
    return NextResponse.json({ error: 'userIdToRemove é obrigatório' }, { status: 400 });
  }

  const { session, role, isCreator } = await getMyRoleInDivvy(divvyId);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSystemAdmin = isSystemAdminEmail(session.user.email);
  const isGroupAdmin = role === 'admin';

  // Criador/admin do grupo OU admin global -> remove imediatamente
  if (isCreator || isGroupAdmin || isSystemAdmin) {
    // evita remover o criador pelo fluxo normal (opcional)
    const { data: divvy } = await supabase
      .from('divvies')
      .select('creatorid')
      .eq('id', divvyId)
      .single();
    if (divvy?.creatorid === userIdToRemove) {
      return NextResponse.json(
        { error: 'Não é permitido remover o criador do grupo.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('divvymembers')
      .delete()
      .eq('divvyid', divvyId)
      .eq('userid', userIdToRemove);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ action: 'removed' });
  }

  // Caso contrário -> cria pedido de remoção (pending)
  const { error: reqErr } = await supabase.from('divvymember_removal_requests').insert({
    divvyid: divvyId,
    requestedby: session.user.id,
    targetuserid: userIdToRemove,
    reason: reason ? String(reason).trim() : null,
    status: 'pending',
  });

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });

  return NextResponse.json({ action: 'requested' }, { status: 202 });
}
