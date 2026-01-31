import type { SupabaseClient } from '@supabase/supabase-js';

export type AnyRow = Record<string, any>;

export async function tableExists(supabase: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select('id').limit(1);
  return !error;
}

export async function pickFirstExistingTable(
  supabase: SupabaseClient,
  candidates: string[]
): Promise<string | null> {
  for (const t of candidates) {
    const exists = await tableExists(supabase, t);
    if (exists) return t;
  }
  return null;
}

export function pickField(row: AnyRow | null | undefined, candidates: string[]): string | null {
  if (!row) return null;
  for (const k of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, k)) return k;
  }
  return null;
}

export async function detectGroupIdColumn(
  supabase: SupabaseClient,
  table: string,
  divvyId: string,
  candidates: string[] = ['divvy_id', 'divvyid', 'divvyId', 'group_id', 'groupid', 'groupId', 'divvy', 'group']
): Promise<string | null> {
  for (const col of candidates) {
    const { error } = await supabase.from(table).select('id').eq(col, divvyId).limit(1);

    if (!error) return col;

    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('does not exist') && msg.includes(col)) continue;

    return col;
  }
  return null;
}

export async function detectColumn(
  supabase: SupabaseClient,
  table: string,
  column: string
): Promise<boolean> {
  const { error } = await supabase.from(table).select(column).limit(1);
  return !error;
}
