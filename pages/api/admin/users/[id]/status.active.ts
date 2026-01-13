
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../../lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpgifiumxqzbroejhudc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { status } = req.body;

  if (!id || !['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const adminClient = createServerSupabaseClient();

    // Check Admin Permissions
    const { data: profile } = await adminClient.from('userprofiles').select('is_super_admin').eq('id', user.id).single();
    const isHardcodedAdmin = user.email === 'falecomdivvy@gmail.com';
    
    if (!isHardcodedAdmin && !profile?.is_super_admin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { error: updateError } = await adminClient
      .from('userprofiles')
      .update({ status })
      .eq('id', id);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
