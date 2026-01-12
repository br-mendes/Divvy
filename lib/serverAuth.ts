
import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

// Fallback values must match those in lib/supabase.ts
const DEFAULT_URL = 'https://jpgifiumxqzbroejhudc.supabase.co';
const DEFAULT_KEY = 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

/**
 * Validates the user session server-side.
 * Returns the User object if authenticated, otherwise throws an error or sends 401.
 */
export async function authorizeUser(req: NextApiRequest, res: NextApiResponse): Promise<User> {
  // Pass explicit configuration to handle cases where env vars are not set but defaults exist
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

  const supabase = createPagesServerClient(
    { req, res },
    { supabaseUrl, supabaseKey }
  );
  
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error('Unauthorized');
  }

  return session.user;
}
