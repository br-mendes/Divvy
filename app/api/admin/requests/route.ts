import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { isSystemAdminEmail } from '@/lib/auth/admin';
import { createServiceSupabase } from '@/lib/supabase/service';

export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSystemAdminEmail(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const svc = createServiceSupabase();

  const { data, error } = await svc
    .from('divvy_action_requests')
    .select('id, divvyid, type, status, requested_by, target_userid, reason, createdat')
    .eq('status', 'pending')
    .order('createdat', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}
