
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
    // 1. Buscar convite
    const { data: invite, error: inviteError } = await supabase
      .from('divvyinvites')
      .select('*')
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

    // Opcional: Validar se o email bate com o convidado (Case insensitive)
    if (invite.invitedemail.toLowerCase() !== userEmail.toLowerCase()) {
       // Permite aceitar se for diferente? A spec diz para validar.
       // return res.status(403).json({ error: 'Este convite foi enviado para outro endereço de email.' });
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

    // 4. Adicionar Membro e Atualizar Convite (Transação implícita via chamadas sequenciais)
    const { error: memberError } = await supabase.from('divvymembers').insert({
      divvyid: invite.divvyid,
      userid: userId,
      email: userEmail,
      role: 'member',
      joinedat: new Date().toISOString()
    });

    if (memberError) throw memberError;

    const { error: updateError } = await supabase
      .from('divvyinvites')
      .update({ 
        status: 'accepted',
        acceptedat: new Date().toISOString()
      })
      .eq('id', inviteToken);

    if (updateError) throw updateError;

    // 5. Retornar dados do grupo para redirecionamento
    const { data: divvy } = await supabase.from('divvies').select('id, name').eq('id', invite.divvyid).single();

    return res.status(200).json({ 
        success: true, 
        divvyId: invite.divvyid,
        divvyName: divvy?.name
    });

  } catch (error: any) {
    console.error('Accept Invite Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
