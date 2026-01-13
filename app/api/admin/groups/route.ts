import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';

async function assertAdmin(request: Request) {
  const user = await authorizeUser(request);
  const adminClient = createServerSupabaseClient();
  const { data: profile } = await adminClient
    .from('userprofiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();
  const isHardcodedAdmin = user.email === 'falecomdivvy@gmail.com';

  if (!isHardcodedAdmin && !profile?.is_super_admin) {
    throw new Error('Forbidden');
  }

  return { user, adminClient };
}

export async function GET(request: Request) {
  try {
    const { adminClient } = await assertAdmin(request);

    const { data: groups, error } = await adminClient
      .from('divvies')
      .select(`
        *,
        divvymembers (count)
      `)
      .order('createdat', { ascending: false })
      .limit(50);

    if (error) throw error;

    const formatted = (groups || []).map((g: any) => ({
      ...g,
      member_count: g.divvymembers ? g.divvymembers[0].count : 0,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Groups API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { adminClient } = await assertAdmin(request);
    const { id } = await request.json();

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await adminClient.from('divvymembers').delete().eq('divvyid', id);
    await adminClient.from('expenses').delete().eq('divvyid', id);
    await adminClient.from('transactions').delete().eq('divvyid', id);

    const { error } = await adminClient.from('divvies').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Groups API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
