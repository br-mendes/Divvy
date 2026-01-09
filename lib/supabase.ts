import { createClient } from '@supabase/supabase-js';

// Default values to prevent crash if env vars are missing
const DEFAULT_URL = 'https://jpgifiumxqzbroejhudc.supabase.co';
const DEFAULT_KEY = 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

// Use NEXT_PUBLIC_ prefix for client-side environment variables in Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using default fallbacks.');
}

// Ensure we never pass an empty string to createClient
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export default supabase;