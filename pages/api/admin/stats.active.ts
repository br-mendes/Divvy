
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

  // 1. Get Token from Header
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token' });

  // 2. Validate User
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Unauthorized: Invalid token' });

  try {
    // 3. Use Service Role Client for Admin Operations (Bypasses RLS)
    // Only after we have verified the user is an admin
    const adminClient = createServerSupabaseClient();

    // Check Permissions
    const isAdmin = await isAdminUser(adminClient, user.id, user.email);

    if (!isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const [
      { count: totalUsers },
      { count: totalDivvies },
      { count: activeDivvies },
      { count: inactiveUsers },
    ] = await Promise.all([
      adminClient.from('userprofiles').select('*', { count: 'exact', head: true }),
      adminClient.from('divvies').select('*', { count: 'exact', head: true }),
      adminClient.from('divvies').select('*', { count: 'exact', head: true }).eq('isarchived', false),
      adminClient.from('userprofiles').select('*', { count: 'exact', head: true }).lt('last_login_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
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
