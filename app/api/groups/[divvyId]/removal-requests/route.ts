import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';
import { isSystemAdminEmail } from '@/lib/auth/admin';

export async function GET(_req: Request, { params }: { params: { divvyId: string } }) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  const { session, role, isCreator } = await getMyRoleInDivvy(divvyId);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSystemAdmin = isSystemAdminEmail(session.user.email);
  const isGroupAdminOrCreator = isCreator || role === 'admin';

  if (!isGroupAdminOrCreator && !isSystemAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Pega requests pendentes
  const { data: requests, error: reqErr } = await supabase
    .from('divvymember_removal_requests')
    .select('*')
    .eq('divvyid', divvyId)
    .eq('status', 'pending')
    .order('createdat', { ascending: true });

  if (reqErr) return NextResponse.json({ error: reqErr.message }, { status: 500 });

  // Para exibir emails, buscamos os membros do grupo e mapeamos userid -> email
  const { data: members, error: memErr } = await supabase
    .from('divvymembers')
    .select('userid, email, role')
    .eq('divvyid', divvyId);

  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

  const emailByUserId = new Map<string, string>();
  (members ?? []).forEach((m: any) => emailByUserId.set(m.userid, m.email));

  const enriched = (requests ?? []).map((r: any) => ({
    ...r,
    requestedbyemail: emailByUserId.get(r.requestedby) ?? null,
    targetuseremail: emailByUserId.get(r.targetuserid) ?? null,
  }));

  return NextResponse.json({ requests: enriched });
}
