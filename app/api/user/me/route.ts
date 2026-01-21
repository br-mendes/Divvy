import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';

export async function GET(request: Request) {
  try {
    const user = await authorizeUser(request);
    const supabase = createServerSupabaseClient();

    const { data: profile, error } = await supabase
      .from('userprofiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json(profile, { status: 200 });
  } catch (error: any) {
    console.error('Profile API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
