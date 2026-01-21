import { SupabaseClient } from '@supabase/supabase-js';

export async function isAdminUser(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<boolean> {
  const query = email ? `id.eq.${userId},email.eq.${email}` : `id.eq.${userId}`;
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .or(query)
    .maybeSingle();

  return !!data;
}
