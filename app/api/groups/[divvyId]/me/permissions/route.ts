import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createServerSupabase();
  const divvyId = params.divvyId;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: membership, error: membershipError } = await supabase
    .from('divvymembers')
    .select('role')
    .eq('divvyid', divvyId)
    .eq('userid', session.user.id)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  if (!membership) {
    return NextResponse.json({ error: 'Você não é membro deste grupo.' }, { status: 403 });
  }

  const role = membership.role ?? 'member';
  const canManageGroup = role === 'admin' || role === 'creator';

  return NextResponse.json({
    role,
    canManageGroup,
    canManagePeriods: canManageGroup,
  });
}
