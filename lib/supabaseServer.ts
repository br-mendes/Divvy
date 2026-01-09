import { supabase } from './supabase';

/**
 * Adapter for compatibility with Next.js specific code.
 * Since this is a SPA, we return the client-side instance which is already configured.
 * This prevents "supabaseUrl is required" errors caused by missing Node.js process.env variables.
 */
export const createServerSupabaseClient = () => {
  return supabase;
};
