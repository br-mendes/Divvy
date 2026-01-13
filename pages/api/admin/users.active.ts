
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createPagesServerClient({ req, res });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Check Admin Permissions
    const { data: profile } = await supabase.from('userprofiles').select('is_super_admin').eq('id', user.id).single();
    const isHardcodedAdmin = user.email === 'falecomdivvy@gmail.com';
    
    if (!isHardcodedAdmin && !profile?.is_super_admin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: users, error } = await supabase
      .from('userprofiles')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) throw error;

    return res.status(200).json(users);
  } catch (error: any) {
    console.error("Users API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
