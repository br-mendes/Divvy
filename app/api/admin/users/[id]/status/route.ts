import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();
    const userId = params.id;

    if (!userId || !['active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

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

    const { error: updateError } = await adminClient
      .from('userprofiles')
      .update({ status })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
