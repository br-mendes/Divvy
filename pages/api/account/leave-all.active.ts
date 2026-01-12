
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const supabase = createServerSupabaseClient();

  try {
    // 1. Excluir grupos onde o usuário é CRIADOR (Isso apaga o grupo para todos)
    const { error: deleteCreatedError } = await supabase
      .from('divvies')
      .delete()
      .eq('creatorid', userId);

    if (deleteCreatedError) throw deleteCreatedError;

    // 2. Sair de grupos onde o usuário é apenas MEMBRO
    // A query acima já removeu os grupos criados, então restam apenas as memberships em grupos de outros.
    const { error: leaveError } = await supabase
      .from('divvymembers')
      .delete()
      .eq('userid', userId);

    if (leaveError) throw leaveError;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Leave All Groups Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
