import { createClient } from '@supabase/supabase-js';

// Safe environment variable access for Vite/Browser
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    console.warn('Error accessing environment variable:', key);
  }
  return undefined;
};

// Default values to prevent crash if env vars are missing
// These fallbacks ensure the app initializes, though auth might fail if keys are invalid
const DEFAULT_URL = 'https://jpgifiumxqzbroejhudc.supabase.co';
const DEFAULT_KEY = 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

// Use VITE_ prefix for client-side environment variables as configured in .env.local
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || DEFAULT_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using default fallbacks.');
}

// Ensure we never pass an empty string to createClient
export const supabase = createClient(
  supabaseUrl || DEFAULT_URL,
  supabaseAnonKey || DEFAULT_KEY
);

export default supabase;