
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';
import { isAdminUser } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. Authenticate
    const user = await authorizeUser(req, res);
    const supabase = createServerSupabaseClient();

    // 2. Check Admin Permissions
    const isAdmin = await isAdminUser(supabase, user.id, user.email);

    if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    if (req.method === 'GET') {
      const { data: groups, error } = await supabase
        .from('divvies')
        .select(`
          *,
          divvymembers (count)
        `)
        .order('createdat', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted = groups.map((g: any) => ({
        ...g,
        member_count: g.divvymembers ? g.divvymembers[0].count : 0
      }));

      return res.status(200).json(formatted);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'ID required' });

      // Clean up related data first
      await supabase.from('divvymembers').delete().eq('divvyid', id);
      await supabase.from('expenses').delete().eq('divvyid', id);
      await supabase.from('transactions').delete().eq('divvyid', id);
      
      const { error } = await supabase.from('divvies').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
