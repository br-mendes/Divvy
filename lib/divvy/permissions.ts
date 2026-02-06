import { createServerSupabase } from '@/lib/supabase/server';

export async function getMyRoleInDivvy(divvyId: string) {
  const supabase = createServerSupabase();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { session: null as any, role: null as null | 'admin' | 'member', isCreator: false };
  }

  // Destrava todos os "never" causados por types desalinhados
  const sb = supabase as any;

  const { data: divvy } = await sb
    .from('divvies')
    .select('id, creatorid')
    .eq('id', divvyId)
    .maybeSingle();

  const isCreator = !!divvy && divvy.creatorid === session.user.id;

  const { data: member } = await sb
    .from('divvymembers')
    .select('role')
    .eq('divvyid', divvyId)
    .eq('userid', session.user.id)
    .maybeSingle();

  return { session, role: member?.role ?? null, isCreator };
}
