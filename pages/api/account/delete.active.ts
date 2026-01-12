
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
    // 1. (Opcional) Fazer backup ou log antes de deletar
    await supabase.from('accountdeletionrequests').insert({
      userid: userId,
      email: 'deleted_user', // Não temos o email aqui facilmente sem query, e ele será apagado
      createdat: new Date().toISOString()
    });

    // 2. Deletar usuário do Auth (Isso deve disparar CASCADE no public.userprofiles e public.divvies se configurado no banco)
    // Se o CASCADE não estiver configurado no banco, precisaríamos deletar manualmente os dados relacionados antes.
    // Assumindo ON DELETE CASCADE nas FKs do schema SQL.
    
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Delete Account Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
