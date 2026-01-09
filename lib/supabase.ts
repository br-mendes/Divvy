
import { createClient } from '@supabase/supabase-js';

// Default values provided by the user
const DEFAULT_URL = 'https://jpgifiumxqzbroejhudc.supabase.co';
const DEFAULT_KEY = 'sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export default supabase;
