import { cookies } from 'next/headers';
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
