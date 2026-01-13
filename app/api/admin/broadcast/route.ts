import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';

export async function POST(request: Request) {
  try {
    const { title, body, target, starts_at, ends_at } = await request.json();

    if (!title || !body || !target) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 });
    }

    const user = await authorizeUser(request);
    const supabase = createServerSupabaseClient();

    const { data: profile } = await supabase
      .from('userprofiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();
    const isHardcodedAdmin = user.email === 'falecomdivvy@gmail.com';

    if (!isHardcodedAdmin && !profile?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase.from('broadcastmessages').insert({
      title,
      body,
      target,
      starts_at: starts_at || new Date().toISOString(),
      ends_at: ends_at || null,
      createdat: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
