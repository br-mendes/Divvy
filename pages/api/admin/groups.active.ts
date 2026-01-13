
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpgifiumxqzbroejhudc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createPagesServerClient({ req, res }, { supabaseUrl, supabaseKey });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Check Admin Permissions
    const { data: profile } = await supabase.from('userprofiles').select('is_super_admin').eq('id', user.id).single();
    const isHardcodedAdmin = user.email === 'falecomdivvy@gmail.com';
    
    if (!isHardcodedAdmin && !profile?.is_super_admin) {
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
    console.error("Groups API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
