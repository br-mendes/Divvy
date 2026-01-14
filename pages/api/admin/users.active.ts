
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';
import { isAdminUser } from '../../../lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpgifiumxqzbroejhudc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const adminClient = createServerSupabaseClient();

    // Check Admin Permissions
    const isAdmin = await isAdminUser(adminClient, user.id, user.email);

    if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { data: users, error: dbError } = await adminClient
      .from('userprofiles')
      .select('*')
      .order('createdat', { ascending: false });

    if (dbError) throw dbError;

    return res.status(200).json(users);
  } catch (error: any) {
    console.error("Users API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
