
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient();
  const { inviteToken, userId, userEmail } = req.body;

  if (!inviteToken || !userId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Buscar convite e dados do grupo/criador
    const { data: invite, error: inviteError } = await supabase
      .from('divvyinvites')
      .select('*, divvies(name, creatorid)')
      .eq('id', inviteToken)
      .single();

    if (inviteError || !invite) {
      return res.status(404).json({ error: 'Convite inválido ou não encontrado.' });
    }

    // 2. Validações
    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'Este convite já foi utilizado.' });
    }

    if (new Date(invite.expiresat) < new Date()) {
      return res.status(400).json({ error: 'Este convite expirou.' });
    }

    // 3. Verificar se já é membro
    const { data: existingMember } = await supabase
      .from('divvymembers')
      .select('id')
      .eq('divvyid', invite.divvyid)
      .eq('userid', userId)
      .single();

    if (existingMember) {
      return res.status(400).json({ error: 'Você já faz parte deste grupo.' });
    }

    // 4. Adicionar Membro
    const { error: memberError } = await supabase.from('divvymembers').insert({
      divvyid: invite.divvyid,
      userid: userId,
      email: userEmail,
      role: 'member',
      joinedat: new Date().toISOString()
    });

    if (memberError) throw memberError;

    // 5. Atualizar status do convite
    const { error: updateError } = await supabase
      .from('divvyinvites')
      .update({ 
        status: 'accepted',
        acceptedat: new Date().toISOString()
      })
      .eq('id', inviteToken);

    if (updateError) throw updateError;

    // 6. Notificar o Criador do Grupo
    // Buscar nome do novo usuário para a mensagem
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
            type: 'invite', // ou 'other'
            title: 'Novo Membro',
            message: `${newUserName} aceitou o convite e entrou no grupo ${divvyName}.`,
            created_at: new Date().toISOString(),
            is_read: false
        });
    }

    return res.status(200).json({ 
        success: true, 
        divvyId: invite.divvyid,
        divvyName: divvyName
    });

  } catch (error: any) {
    console.error('Accept Invite Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
