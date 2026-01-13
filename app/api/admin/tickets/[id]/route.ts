import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
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

    const { error } = await supabase
      .from('supporttickets')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
