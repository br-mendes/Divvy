
import { createClient } from '@supabase/supabase-js';

/**
 * Creates a server-side Supabase client with elevated privileges.
 * WARNING: Only use this in API routes or server contexts.
 * Build-safe: doesn't throw during module initialization
 */
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing env NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseServiceKey) {
    throw new Error('Missing env SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
