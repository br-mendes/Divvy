import { cookies } from 'next/headers';
import { createServerClient, createClient } from '@supabase/ssr';
import { Database } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { hasSupabaseEnv } from '@/lib/supabase/env';

export function createSupabaseServerClient(): SupabaseClient<Database> {
  if (!hasSupabaseEnv()) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export function createSupabaseClient(): SupabaseClient<Database> {
  if (!hasSupabaseEnv()) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}