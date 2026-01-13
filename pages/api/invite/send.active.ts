
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { sendInviteEmail } from '../../../lib/email';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { getURL } from '../../../lib/getURL';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Configuração para garantir JSON mesmo em erros
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Autenticação Segura
    // Se falhar, authorizeUser lança erro, que é pego pelo catch abaixo
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();
    
    const { divvyId, email } = req.body;

    if (!divvyId || !email) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando (divvyId, email).' });
    }

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

    // 3. Verificar se convite já existe (apenas pendentes)
    const { data: existing } = await supabase
      .from('divvyinvites')
      .select('*')
      .eq('divvyid', divvyId)
      .eq('invitedemail', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    let inviteToken;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); 

    if (existing) {
      // Reenvio
      inviteToken = existing.id;
      const { error: updateError } = await supabase
        .from('divvyinvites')
        .update({ 
            expiresat: expiresAt,
            createdat: new Date().toISOString()
        })
        .eq('id', inviteToken);

      if (updateError) throw updateError;
    } else {
      // Novo
      inviteToken = uuidv4();
      const { error: insertError } = await supabase.from('divvyinvites').insert({
        id: inviteToken,
        divvyid: divvyId,
        invitedemail: email.toLowerCase(),
        invitedbyuserid: user.id,
        status: 'pending',
        expiresat: expiresAt,
      });

      if (insertError) throw insertError;
    }

    // 4. Preparar dados
    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', divvyId).single();
    const { data: inviterProfile } = await supabase.from('userprofiles').select('fullname, displayname').eq('id', user.id).single();
    
    const inviterName = inviterProfile?.displayname || inviterProfile?.fullname || user.email || 'Um amigo';
    const divvyName = divvy?.name || 'Grupo de Despesas';

    const baseUrl = getURL();
    const inviteLink = `${baseUrl}/join/${inviteToken}`;
    
    let qrCode = '';
    try {
        qrCode = await QRCode.toDataURL(inviteLink);
    } catch (qrErr) {
        console.error("Erro ao gerar QR Code:", qrErr);
    }

    // 5. Enviar Email
    try {
        await sendInviteEmail(email, divvyName, inviterName, inviteLink, qrCode);
    } catch (emailErr) {
        console.error("Erro no envio de email, mas convite criado:", emailErr);
        // Não falhamos a requisição se o email falhar, retornamos o link
    }

    return res.status(200).json({ success: true, inviteLink });

  } catch (error: any) {
    console.error('Invite API Error:', error);
    const message = error.message === 'Unauthorized' ? 'Sessão expirada. Faça login novamente.' : (error.message || 'Erro interno do servidor');
    const status = error.message === 'Unauthorized' ? 401 : 500;
    
    return res.status(status).json({ error: message });
  }
}
