
import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

// Fallback credentials matching lib/supabase.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpgifiumxqzbroejhudc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

/**
 * Validates the user session server-side.
 * Returns the User object if authenticated, otherwise throws an error or sends 401.
 */
export async function authorizeUser(req: NextApiRequest, res: NextApiResponse): Promise<User> {
  const supabase = createPagesServerClient({ req, res }, { supabaseUrl, supabaseKey });
  
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error('Unauthorized');
  }

  return session.user;
}
