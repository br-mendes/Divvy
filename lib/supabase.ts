import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();

export async function getDivvies(userId: string) {
  const { data, error } = await supabase
    .from('divvies')
    .select('*, members:divvy_members(*)')
    .or(`creator_id.eq.${userId},divvy_members.user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
