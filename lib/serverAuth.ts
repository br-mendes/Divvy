
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpgifiumxqzbroejhudc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

/**
 * Validates the user session server-side using Bearer token from header.
 * Use this to verify identity in API Routes when using client-side localStorage auth.
 */
export async function authorizeUser(req: NextApiRequest, res: NextApiResponse): Promise<User> {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new Error('Unauthorized');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}
