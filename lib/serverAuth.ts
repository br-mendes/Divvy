
import { createClient, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseKey) {
  throw new Error('Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Validates the user session server-side using Bearer token from header.
 * Use this to verify identity in API Routes when using client-side localStorage auth.
 */
export async function authorizeUser(request: Request): Promise<User> {
  const token = request.headers.get('authorization')?.split(' ')[1];
  
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
