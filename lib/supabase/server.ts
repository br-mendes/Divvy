import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

export function createSupabaseServerClient(): SupabaseClient<Database> {
  const url = mustEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = mustEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Route Handlers, cookies() is mutable.
        // In Server Components it may be read-only; this will be a no-op.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // ignore
        }
      },
    },
  });
}

// Helper for Middleware + auth callback route: writes cookies into NextResponse.
export function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
  const url = mustEnv('NEXT_PUBLIC_SUPABASE_URL');
  const anonKey = mustEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });
}

export const createServerSupabase = createSupabaseServerClient;
