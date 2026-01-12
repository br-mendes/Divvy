
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { divvyId, userId } = req.body;
  const supabase = createServerSupabaseClient();

  try {
    // Validar se é membro
    const { data: member } = await supabase
        .from('divvymembers')
        .select('id')
        .eq('divvyid', divvyId)
        .eq('userid', userId)
        .single();
    
    if (!member) return res.status(403).json({ error: 'Você não é membro deste grupo.' });

    const { error } = await supabase
        .from('divvies')
        .update({ archivesuggested: false })
        .eq('id', divvyId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
