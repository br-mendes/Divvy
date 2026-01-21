import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { divvyId: string; paymentId: string } }
) {
  const supabase = createServerSupabase();
  const { divvyId, paymentId } = params;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)
    .eq('divvyid', divvyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
