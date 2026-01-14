
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { isAdminUser } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();

    // Check Admin Permissions
    const isAdmin = await isAdminUser(supabase, user.id, user.email);

    if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: users, error } = await supabase
      .from('userprofiles')
      .select('*')
      .order('createdat', { ascending: false });

    if (error) throw error;

    return res.status(200).json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
