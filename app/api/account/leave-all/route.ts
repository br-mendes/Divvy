import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error: deleteCreatedError } = await supabase
      .from('divvies')
      .delete()
      .eq('creatorid', userId);

    if (deleteCreatedError) throw deleteCreatedError;

    const { error: leaveError } = await supabase
      .from('divvymembers')
      .delete()
      .eq('userid', userId);

    if (leaveError) throw leaveError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Leave All Groups Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
