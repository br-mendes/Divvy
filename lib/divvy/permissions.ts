import { createServerSupabase } from '@/lib/supabase/server';

export async function getMyRoleInDivvy(divvyId: string) {
  const supabase = createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { session: null as any, role: null as null | 'admin' | 'member', isCreator: false };
  }

  const { data: divvy } = await supabase
    .from('divvies')
    .select('id, creatorid')
    .eq('id', divvyId)
    .single();

  const isCreator = !!divvy && divvy.creatorid === session.user.id;

  const { data: member } = await supabase
    .from('divvymembers')
    .select('role')
    .eq('divvyid', divvyId)
    .eq('userid', session.user.id)
    .single();

  return { session, role: member?.role ?? null, isCreator };
}
