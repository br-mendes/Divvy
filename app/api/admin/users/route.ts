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

    const { data: users, error: dbError } = await adminClient
      .from('userprofiles')
      .select('*')
      .order('createdat', { ascending: false });

    if (dbError) throw dbError;

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error('Users API Error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
