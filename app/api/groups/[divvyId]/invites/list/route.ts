import { NextResponse } from 'next/server';

import { isSystemAdminEmail } from '@/lib/auth/admin';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  const { session, role, isCreator } = await getMyRoleInDivvy(divvyId);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSystemAdmin = isSystemAdminEmail(session.user.email);
  const canManage = isSystemAdmin || isCreator || role === 'admin';
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('divvyinvites')
    .select(
      'id, divvyid, token, invitedemail, role, status, createdat, expiresat, acceptedat, acceptedby, invitedby'
    )
    .eq('divvyid', divvyId)
    .order('createdat', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ invites: data ?? [] });
}
