
import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

/**
 * Validates the user session server-side.
 * Returns the User object if authenticated, otherwise throws an error or sends 401.
 */
export async function authorizeUser(req: NextApiRequest, res: NextApiResponse): Promise<User> {
  const supabase = createPagesServerClient({ req, res });
  
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new Error('Unauthorized');
  }

  return session.user;
}
