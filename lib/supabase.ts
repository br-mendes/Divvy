import { createClient } from '@supabase/supabase-js';

// Safe environment variable access for Vite/Browser
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  return null;
};

// Use import.meta.env for Vite, with hardcoded fallbacks for the demo
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://jpgifiumxqzbroejhudc.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;