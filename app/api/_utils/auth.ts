import { cookies } from 'next/headers';
<<<<<<< HEAD
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
=======
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createPublicSupabase } from '@/lib/supabase/publicServerClient';

export async function getUserFromRequest(req: Request): Promise<{ userId: string; mode: 'bearer' | 'cookie' } | null> {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m?.[1]) {
    const supa = createPublicSupabase();
    if (!supa) return null;

    const token = m[1].trim();
    const { data, error } = await supa.auth.getUser(token);
    if (error || !data?.user?.id) return null;

    return { userId: data.user.id, mode: 'bearer' };
  }

  const supabase = createRouteHandlerClient({ cookies }) as SupabaseClient;
  const { data } = await supabase.auth.getUser();
  const id = data?.user?.id;
  if (!id) return null;

  return { userId: id, mode: 'cookie' };
}
>>>>>>> 3742ed0ae9e93e68ce111148d75a3f9568b2e852
