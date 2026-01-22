import { NextResponse } from 'next/server';
import {
  requireUser,
  jsonError,
  pickFirstWorkingTable,
} from '@/app/api/_utils/supabase';

export const dynamic = 'force-dynamic';

const GROUP_TABLE_CANDIDATES = ['divvies', 'groups'];

export async function GET() {
  const { supabase, user, error } = await requireUser();
  if (error) return error;

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

  // RLS should restrict to user memberships; if not configured, adjust later.
  const { data, error: qErr } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (qErr) return jsonError(500, 'QUERY_FAILED', 'Failed to list groups.', { qErr });

  return NextResponse.json({ ok: true, userId: user.id, table, groups: data ?? [] });
}

export async function POST(req: Request) {
  const { supabase, user, error } = await requireUser();
  if (error) return error;

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

  const body = await req.json().catch(() => ({}));
  const name = (body?.name ?? '').toString().trim();
  const description = (body?.description ?? '').toString().trim();

  if (!name) return jsonError(400, 'VALIDATION', 'Field "name" is required.');

  // Try common creator columns: created_by / owner_id / user_id (tolerant).
  const candidates = [
    { created_by: user.id },
    { owner_id: user.id },
    { user_id: user.id },
  ];

  let created: any = null;
  let lastCreateErr: any = null;

  for (const extra of candidates) {
    const { data, error: insErr } = await supabase
      .from(table)
      .insert([{ name, description, ...extra }])
      .select('*')
      .single();

    if (!insErr) {
      created = data;
      break;
    }
    lastCreateErr = insErr;
  }

  // If none worked, try without extra ownership column (maybe handled by trigger/default).
  if (!created) {
    const { data, error: insErr } = await supabase
      .from(table)
      .insert([{ name, description }])
      .select('*')
      .single();

    if (insErr) lastCreateErr = insErr;
    else created = data;
  }

  if (!created) {
    return jsonError(
      500,
      'INSERT_FAILED',
      'Failed to create group (schema mismatch likely).',
      { lastCreateErr }
    );
  }

  return NextResponse.json({ ok: true, table, group: created });
}
