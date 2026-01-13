import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    await supabase.from('accountdeletionrequests').insert({
      userid: userId,
      email: 'deleted_user',
      createdat: new Date().toISOString(),
    });

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Delete Account Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
