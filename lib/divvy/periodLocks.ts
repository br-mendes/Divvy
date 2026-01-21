import { createServerSupabase } from '@/lib/supabase/server';

export async function isDateLocked(divvyId: string, dateISO: string): Promise<boolean> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('divvy_periods')
    .select('id')
    .eq('divvyid', divvyId)
    .eq('status', 'closed')
    .lte('period_from', dateISO)
    .gte('period_to', dateISO)
    .limit(1);

  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

export async function assertDateNotLocked(divvyId: string, dateISO: string) {
  const locked = await isDateLocked(divvyId, dateISO);
  if (locked) {
    const err: any = new Error('Periodo fechado: esta data está bloqueada para edições.');
    err.status = 409;
    throw err;
  }
}
