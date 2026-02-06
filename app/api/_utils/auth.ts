import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getUserFromRequest(_req: Request): Promise<{ userId: string; mode: 'cookie' } | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.id) return null;
  return { userId: data.user.id, mode: 'cookie' };
}
