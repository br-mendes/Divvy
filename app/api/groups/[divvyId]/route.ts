import { NextResponse } from 'next/server';
import {
  requireUser,
  jsonError,
  pickFirstWorkingTable,
} from '@/app/api/_utils/supabase';

export const dynamic = 'force-dynamic';

const GROUP_TABLE_CANDIDATES = ['divvies', 'groups'];

export async function GET(
  _req: Request,
  { params }: { params: { divvyId: string } }
) {
  const { supabase, user, error } = await requireUser();
  if (error) return error;

  const divvyId = params.divvyId;
  if (!divvyId) return jsonError(400, 'VALIDATION', 'Missing divvyId param.');

  const { table, lastError } = await pickFirstWorkingTable(
    supabase,
    GROUP_TABLE_CANDIDATES
  );
  if (!table) {
    return jsonError(
      500,
      'SCHEMA_NOT_FOUND',
      'Could not find groups table (tried divvies, groups).',
      { lastError }
    );
  }

  const { data, error: qErr } = await supabase
    .from(table)
    .select('*')
    .eq('id', divvyId)
    .single();
  if (qErr) {
    return jsonError(404, 'NOT_FOUND', 'Group not found or not accessible.', {
      qErr,
    });
  }

  return NextResponse.json({ ok: true, userId: user.id, table, group: data });
}
