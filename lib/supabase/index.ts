import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Build-safe: Don't throw during module initialization
// This allows the build to complete even without env vars
let _supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  _supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Export client getter that validates at runtime
export const supabase = _supabaseClient!;

// Helper to check if supabase is configured
export function hasSupabase(): boolean {
  return _supabaseClient !== null;
}