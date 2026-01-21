import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';
import { isSystemAdminEmail } from '@/lib/auth/admin';

export async function POST(
  _req: Request,
  { params }: { params: { divvyId: string; periodId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, periodId } = params;

  const { session, role, isCreator } = await getMyRoleInDivvy(divvyId);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSystemAdmin = isSystemAdminEmail(session.user.email);
  const canManage = isSystemAdmin || isCreator || role === 'admin';
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await supabase
    .from('divvy_periods')
    .update({ status: 'open' })
    .eq('id', periodId)
    .eq('divvyid', divvyId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ period: data });
}
