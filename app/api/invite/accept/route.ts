import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const { inviteToken, userId, userEmail } = await request.json();

    if (!inviteToken || !userId || !userEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: invite, error: inviteError } = await supabase
      .from('divvyinvites')
      .select('*, divvies(name, creatorid)')
      .eq('id', inviteToken)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Convite inválido ou não encontrado.' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Este convite já foi utilizado.' }, { status: 400 });
    }

    if (new Date(invite.expiresat) < new Date()) {
      return NextResponse.json({ error: 'Este convite expirou.' }, { status: 400 });
    }

    const { data: existingMember } = await supabase
      .from('divvymembers')
      .select('id')
      .eq('divvyid', invite.divvyid)
      .eq('userid', userId)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: 'Você já faz parte deste grupo.' }, { status: 400 });
    }

    const { error: memberError } = await supabase.from('divvymembers').insert({
      divvyid: invite.divvyid,
      userid: userId,
      email: userEmail,
      role: 'member',
      joinedat: new Date().toISOString(),
    });

    if (memberError) throw memberError;

    const { error: updateError } = await supabase
      .from('divvyinvites')
      .update({
        status: 'accepted',
        acceptedat: new Date().toISOString(),
      })
      .eq('id', inviteToken);

    if (updateError) throw updateError;

    const { data: newUserProfile } = await supabase
      .from('userprofiles')
      .select('fullname, displayname')
      .eq('id', userId)
      .single();

    const newUserName = newUserProfile?.displayname || newUserProfile?.fullname || userEmail;
    const divvyName = (invite.divvies as any)?.name || 'Grupo';
    const creatorId = (invite.divvies as any)?.creatorid;

    if (creatorId && creatorId !== userId) {
      await supabase.from('notifications').insert({
        user_id: creatorId,
        divvy_id: invite.divvyid,
        type: 'invite',
        title: 'Novo Membro',
        message: `${newUserName} aceitou o convite e entrou no grupo ${divvyName}.`,
        created_at: new Date().toISOString(),
        is_read: false,
      });
    }

    return NextResponse.json({
      success: true,
      divvyId: invite.divvyid,
      divvyName: divvyName,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Accept Invite Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
