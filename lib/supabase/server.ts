import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from './env';

/**
 * Server-side Supabase client for Route Handlers / Server Components.
 * - Uses cookies() so auth persists.
 * - NEVER throws during import (build-safe). Caller should handle missing env.
 */
export function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        // next/headers cookies() supports set in route handlers in modern Next versions;
        // if the runtime disallows, routes still work for reads (and you'll see it in logs).
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
}
