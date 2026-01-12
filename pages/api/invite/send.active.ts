
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { sendInviteEmail } from '../../../lib/email';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { getURL } from '../../../lib/getURL';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Autenticação Segura (Obtém usuário da sessão)
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();
    
    // invitedByUserId agora vem da sessão autenticada (user.id)
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
      .maybeSingle(); // maybeSingle evita erro se não encontrar

    let inviteToken;
    // Expira em 7 dias
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); 

    if (existing) {
      // REENVIO: Se já existe pendente, reutilizamos o token e renovamos a validade
      inviteToken = existing.id;
      
      const { error: updateError } = await supabase
        .from('divvyinvites')
        .update({ 
            expiresat: expiresAt,
            createdat: new Date().toISOString() // Atualiza data de criação para parecer novo
        })
        .eq('id', inviteToken);

      if (updateError) throw updateError;
    } else {
      // NOVO: Se não existe ou o anterior foi rejeitado/aceito, cria novo
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

    // 4. Preparar dados para email
    const { data: divvy } = await supabase.from('divvies').select('name').eq('id', divvyId).single();
    const { data: inviterProfile } = await supabase.from('userprofiles').select('fullname, displayname').eq('id', user.id).single();
    
    const inviterName = inviterProfile?.displayname || inviterProfile?.fullname || user.email || 'Um amigo';
    const divvyName = divvy?.name || 'Grupo de Despesas';

    const baseUrl = getURL();
    const inviteLink = `${baseUrl}/join/${inviteToken}`;
    
    // Gerar QR Code com segurança contra falhas
    let qrCode = '';
    try {
        qrCode = await QRCode.toDataURL(inviteLink);
    } catch (qrErr) {
        console.error("Erro ao gerar QR Code:", qrErr);
        // Prossegue sem QR Code se falhar
    }

    // 5. Enviar Email
    await sendInviteEmail(email, divvyName, inviterName, inviteLink, qrCode);

    return res.status(200).json({ success: true, inviteLink });

  } catch (error: any) {
    console.error('Invite API Error:', error);
    // Garante retorno JSON mesmo em erro fatal
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}
