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
  const isGroupAdminOrCreator = isCreator || role === 'admin';

  if (!isGroupAdminOrCreator && !isSystemAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('divvymember_removal_requests')
    .select('*')
    .eq('divvyid', divvyId)
    .eq('status', 'pending')
    .order('createdat', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: data ?? [] });
}
