import { createClient } from '@supabase/supabase-js';

// Safe environment variable access for Vite/Browser
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  return null;
};

// Use import.meta.env for Vite, with hardcoded fallbacks for the demo/production
// Updated with credentials from provided .env.local
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://qsgsvseuuyntndfzthuz.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzZ3N2c2V1dXludG5kZnp0aHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTc5NTMsImV4cCI6MjA4MzQ3Mzk1M30.5YcZHG95UPQbYyKVzpuFTauTBvGZBAtL3P_Otr82DdE';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;