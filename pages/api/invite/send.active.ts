
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { sendInviteEmail } from '../../../lib/email';
import { v4 as uuid } from 'uuid';
import QRCode from 'qrcode';
import { getURL } from '../../../lib/getURL';
import { authorizeUser } from '../../../lib/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createServerSupabaseClient();
  
  const { divvyId, email } = req.body;

  if (!divvyId || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await authorizeUser(req, res);

    // 2. Validar se quem convidou é membro
    const { data: membership, error: memberError } = await supabase
      .from('divvymembers')
      .select('id')
      .eq('divvyid', divvyId)
      .eq('userid', user.id)
      .single();

    if (memberError || !membership) {
      return res.status(403).json({ error: 'Você não tem permissão para convidar para este grupo.' });
    }

    // 3. Verificar se convite já existe
    const { data: existing } = await supabase
      .from('divvyinvites')
      .select('*')
      .eq('divvyid', divvyId)
      .eq('invitedemail', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Já existe um convite pendente para este email.' });
    }

    // 4. Criar Convite
    const inviteToken = uuid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 dias

    const { error: insertError } = await supabase.from('divvyinvites').insert({
      id: inviteToken,
      divvyid: divvyId,
      invitedemail: email.toLowerCase(),
      invitedbyuserid: user.id,
      status: 'pending',
      expiresat: expiresAt,
    });

    if (insertError) throw insertError;

    // 5. Preparar dados para email
    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', divvyId).single();
    const { data: inviterProfile } = await supabase.from('userprofiles').select('fullname, displayname').eq('id', user.id).single();
    
    // Fallback se não tiver userprofiles preenchido (usa email do auth se possível, mas aqui usamos placeholders)
    const inviterName = inviterProfile?.displayname || inviterProfile?.fullname || 'Um amigo';
    const divvyName = divvy?.name || 'Grupo de Despesas';

    const baseUrl = getURL();
    const inviteLink = `${baseUrl}/join/${inviteToken}`;
    const qrCode = await QRCode.toDataURL(inviteLink);

    // 6. Enviar Email
    await sendInviteEmail(email, divvyName, inviterName, inviteLink, qrCode);

    return res.status(200).json({ success: true, inviteLink });

  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    console.error('Invite Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
