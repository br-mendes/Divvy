import { NextResponse } from 'next/server';
import {
  requireUser,
  jsonError,
  pickFirstWorkingTable,
  trySelectWithFilters,
} from '@/app/api/_utils/supabase';

export const dynamic = 'force-dynamic';

const CATEGORY_TABLE_CANDIDATES = ['expense_categories', 'categories'];

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
    CATEGORY_TABLE_CANDIDATES
  );
  if (!table) {
    return jsonError(
      500,
      'SCHEMA_NOT_FOUND',
      'Could not find categories table (tried expense_categories, categories).',
      { lastError }
    );
  }

  // Try divvy_id then group_id then divvyId column variants.
  const res = await trySelectWithFilters(
    supabase,
    table,
    '*',
    [
      { col: 'divvy_id', val: divvyId },
      { col: 'group_id', val: divvyId },
      { col: 'divvyId', val: divvyId },
    ],
    { col: 'created_at', asc: false },
    100
  );

  if (res.error) {
    return jsonError(500, 'QUERY_FAILED', 'Failed to list categories.', {
      table,
      error: res.error,
    });
  }

  return NextResponse.json({
    ok: true,
    userId: user.id,
    table,
    categories: res.data ?? [],
  });
}

export async function POST(
  req: Request,
  { params }: { params: { divvyId: string } }
) {
  const { supabase, user, error } = await requireUser();
  if (error) return error;

  const divvyId = params.divvyId;
  if (!divvyId) return jsonError(400, 'VALIDATION', 'Missing divvyId param.');

  const { table, lastError } = await pickFirstWorkingTable(
    supabase,
    CATEGORY_TABLE_CANDIDATES
  );
  if (!table) {
    return jsonError(
      500,
      'SCHEMA_NOT_FOUND',
      'Could not find categories table (tried expense_categories, categories).',
      { lastError }
    );
  }

  const body = await req.json().catch(() => ({}));
  const name = (body?.name ?? '').toString().trim();
  const icon = (body?.icon ?? '').toString().trim();
  const color = (body?.color ?? '').toString().trim();

  if (!name) return jsonError(400, 'VALIDATION', 'Field "name" is required.');

  // Try divvy_id then group_id
  const candidates = [
    { divvy_id: divvyId },
    { group_id: divvyId },
    { divvyId: divvyId },
  ];

  let created: any = null;
  let lastCreateErr: any = null;

  for (const fk of candidates) {
    const { data, error: insErr } = await supabase
      .from(table)
      .insert([{ name, icon, color, ...fk }])
      .select('*')
      .single();

    if (!insErr) {
      created = data;
      break;
    }
    lastCreateErr = insErr;
  }

  if (!created) {
    return jsonError(
      500,
      'INSERT_FAILED',
      'Failed to create category (schema mismatch likely).',
      { table, lastCreateErr }
    );
  }

  return NextResponse.json({ ok: true, userId: user.id, table, category: created });
}
