
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { isAdminUser } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Valida token do usuário
    const user = await authorizeUser(req, res);
    
    // Usa Service Role para buscar perfil sem disparar RLS
    const supabase = createServerSupabaseClient();

    const { data: profile, error } = await supabase
        .from('userprofiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) throw error;

    const isAdmin = await isAdminUser(supabase, user.id, user.email);

    return res.status(200).json({ ...profile, is_admin: isAdmin });
  } catch (error: any) {
    console.error("Profile API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
