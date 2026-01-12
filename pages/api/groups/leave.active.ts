
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { divvyId, userId } = req.body;
  const supabase = createServerSupabaseClient();

  if (!divvyId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Validar grupo e papel
    const { data: divvy } = await supabase.from('divvies').select('creatorid').eq('id', divvyId).single();
    
    if (!divvy) return res.status(404).json({ error: 'Grupo não encontrado' });
    
    // Criador não pode sair (deve excluir o grupo ou transferir - transfer não implementado neste MVP)
    if (divvy.creatorid === userId) {
        return res.status(403).json({ error: 'O criador não pode sair do grupo. Você pode arquivá-lo ou excluí-lo.' });
    }

    // 2. Remover membro
    const { error } = await supabase
        .from('divvymembers')
        .delete()
        .eq('divvyid', divvyId)
        .eq('userid', userId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
