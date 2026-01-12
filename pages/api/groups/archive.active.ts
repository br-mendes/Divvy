
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { divvyId, userId } = req.body;
  const supabase = createServerSupabaseClient();

  try {
    // Validar se é o criador
    const { data: divvy } = await supabase.from('divvies').select('creatorid').eq('id', divvyId).single();
    
    if (!divvy) return res.status(404).json({ error: 'Grupo não encontrado' });
    if (divvy.creatorid !== userId) return res.status(403).json({ error: 'Apenas o criador pode arquivar o grupo.' });

    const { error } = await supabase
        .from('divvies')
        .update({ 
            isarchived: true, 
            endedat: new Date().toISOString(), 
            archivesuggested: false 
        })
        .eq('id', divvyId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
