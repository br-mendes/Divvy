import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';

export async function GET(request: Request) {
  try {
    const user = await authorizeUser(request);
    const adminClient = createServerSupabaseClient();

    const { data: profile } = await adminClient
      .from('userprofiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();
    const isHardcodedAdmin = user.email === 'falecomdivvy@gmail.com';

    if (!isHardcodedAdmin && !profile?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      { count: totalUsers },
      { count: totalDivvies },
      { count: activeDivvies },
      { count: inactiveUsers },
    ] = await Promise.all([
      adminClient.from('userprofiles').select('*', { count: 'exact', head: true }),
      adminClient.from('divvies').select('*', { count: 'exact', head: true }),
      adminClient.from('divvies').select('*', { count: 'exact', head: true }).eq('isarchived', false),
      adminClient
        .from('userprofiles')
        .select('*', { count: 'exact', head: true })
        .lt('last_login_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      inactive30Count: inactiveUsers || 0,
      activeGroups: activeDivvies || 0,
      totalDivvies: totalDivvies || 0,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Stats API Error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
