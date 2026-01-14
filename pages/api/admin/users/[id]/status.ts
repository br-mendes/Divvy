
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../../../lib/supabaseServer';
import { authorizeUser } from '../../../../../lib/serverAuth';
import { isAdminUser } from '../../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { status } = req.body;

  if (!id || !['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  try {
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();

    // Check Admin Permissions
    const isAdmin = await isAdminUser(supabase, user.id, user.email);

    if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase
      .from('userprofiles')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
