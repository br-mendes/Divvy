
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpgifiumxqzbroejhudc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Usar o cliente autenticado com a sessão do usuário e credenciais explícitas
    const supabase = createPagesServerClient({ req, res }, { supabaseUrl, supabaseKey });
    
    // Validar Usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Check Admin Permissions via Database
    const { data: profile } = await supabase.from('userprofiles').select('is_super_admin').eq('id', user.id).single();
    const isHardcodedAdmin = user.email === 'falecomdivvy@gmail.com';
    
    if (!isHardcodedAdmin && !profile?.is_super_admin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const [
      { count: totalUsers },
      { count: totalDivvies },
      { count: activeDivvies },
      { count: inactiveUsers },
    ] = await Promise.all([
      supabase.from('userprofiles').select('*', { count: 'exact', head: true }),
      supabase.from('divvies').select('*', { count: 'exact', head: true }),
      supabase.from('divvies').select('*', { count: 'exact', head: true }).eq('isarchived', false),
      supabase.from('userprofiles').select('*', { count: 'exact', head: true }).lt('last_login_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    return res.status(200).json({
      totalUsers: totalUsers || 0,
      inactive30Count: inactiveUsers || 0,
      activeGroups: activeDivvies || 0,
      totalDivvies: totalDivvies || 0
    });

  } catch (error: any) {
    console.error("Stats API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
