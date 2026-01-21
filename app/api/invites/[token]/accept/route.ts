import { NextResponse } from 'next/server';

import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const supabase = createServerSupabase();
  const token = params.token;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = (session.user.email ?? '').toLowerCase();

  const { data: invite, error: invErr } = await supabase
    .from('divvyinvites')
    .select('*')
    .eq('token', token)
    .single();

  if (invErr || !invite) {
    return NextResponse.json(
      { error: 'Convite não encontrado' },
      { status: 404 }
    );
  }

  const expired = new Date(invite.expiresat).getTime() < Date.now();
  if (invite.status !== 'pending' || expired) {
    return NextResponse.json(
      { error: 'Convite inválido ou expirado' },
      { status: 400 }
    );
  }

  if (String(invite.invitedemail).toLowerCase() !== userEmail) {
    return NextResponse.json(
      { error: 'Este convite não é para o seu e-mail.' },
      { status: 403 }
    );
  }

  const { error: memErr } = await supabase.from('divvymembers').insert({
    divvyid: invite.divvyid,
    userid: session.user.id,
    email: userEmail,
    role: invite.role,
  });

  if (memErr && !String(memErr.message).toLowerCase().includes('duplicate')) {
    return NextResponse.json({ error: memErr.message }, { status: 500 });
  }

  const { error: updErr } = await supabase
    .from('divvyinvites')
    .update({
      status: 'accepted',
      acceptedat: new Date().toISOString(),
      acceptedby: session.user.id,
    })
    .eq('id', invite.id);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, divvyId: invite.divvyid });
}
