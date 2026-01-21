import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const supabase = createServerSupabase();
  const token = params.token;

  const { data: invite, error } = await supabase
    .from('divvyinvites')
    .select('id, token, invitedemail, role, status, expiresat, divvy:divvies(id,name)')
    .eq('token', token)
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: 'Convite não encontrado' }, { status: 404 });
  }

  const expired = new Date(invite.expiresat).getTime() < Date.now();

  return NextResponse.json({
    invite: {
      ...invite,
      expired,
      valid: invite.status === 'pending' && !expired,
    },
  });
}
