import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { sendInviteEmail } from '@/lib/email';
import { v4 as uuid } from 'uuid';
import QRCode from 'qrcode';
import { getURL } from '@/lib/getURL';

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();

  try {
    const { divvyId, email, invitedByUserId } = await request.json();

    if (!divvyId || !email || !invitedByUserId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: membership, error: memberError } = await supabase
      .from('divvymembers')
      .select('id')
      .eq('divvyid', divvyId)
      .eq('userid', invitedByUserId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Você não tem permissão para convidar para este grupo.' }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from('divvyinvites')
      .select('*')
      .eq('divvyid', divvyId)
      .eq('invitedemail', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Já existe um convite pendente para este email.' }, { status: 400 });
    }

    const inviteToken = uuid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from('divvyinvites').insert({
      id: inviteToken,
      divvyid: divvyId,
      invitedemail: email.toLowerCase(),
      invitedbyuserid: invitedByUserId,
      status: 'pending',
      expiresat: expiresAt,
    });

    if (insertError) throw insertError;

    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', divvyId).single();
    const { data: inviterProfile } = await supabase.from('userprofiles').select('fullname, displayname').eq('id', invitedByUserId).single();

    const inviterName = inviterProfile?.displayname || inviterProfile?.fullname || 'Um amigo';
    const divvyName = divvy?.name || 'Grupo de Despesas';

    const baseUrl = getURL();
    const inviteLink = `${baseUrl}/join/${inviteToken}`;
    const qrCode = await QRCode.toDataURL(inviteLink);

    await sendInviteEmail(email, divvyName, inviterName, inviteLink, qrCode);

    return NextResponse.json({ success: true, inviteLink }, { status: 200 });
  } catch (error: any) {
    console.error('Invite Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
