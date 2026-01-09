
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jpgifiumxqzbroejhudc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_T1k4VjwHnPkFru1U0EGZUw_6weHwTaF';

/**
 * Creates a server-side Supabase client with elevated privileges.
 * WARNING: Only use this in API routes or server contexts.
 */
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
