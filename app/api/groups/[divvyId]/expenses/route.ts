import { NextResponse } from 'next/server';
import {
  requireUser,
  jsonError,
  pickFirstWorkingTable,
  trySelectWithFilters,
} from '@/app/api/_utils/supabase';

export const dynamic = 'force-dynamic';

const EXPENSE_TABLE_CANDIDATES = ['expenses', 'group_expenses'];

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
    EXPENSE_TABLE_CANDIDATES
  );
  if (!table) {
    return jsonError(
      500,
      'SCHEMA_NOT_FOUND',
      'Could not find expenses table (tried expenses, group_expenses).',
      { lastError }
    );
  }

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
    200
  );

  if (res.error) {
    return jsonError(500, 'QUERY_FAILED', 'Failed to list expenses.', {
      table,
      error: res.error,
    });
  }

  return NextResponse.json({
    ok: true,
    userId: user.id,
    table,
    expenses: res.data ?? [],
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
    EXPENSE_TABLE_CANDIDATES
  );
  if (!table) {
    return jsonError(
      500,
      'SCHEMA_NOT_FOUND',
      'Could not find expenses table (tried expenses, group_expenses).',
      { lastError }
    );
  }

  const body = await req.json().catch(() => ({}));
  const description = (body?.description ?? '').toString().trim();
  const amount = Number(body?.amount ?? 0);
  const categoryId = (body?.category_id ?? body?.categoryId ?? '').toString().trim();

  if (!description) {
    return jsonError(400, 'VALIDATION', 'Field "description" is required.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonError(400, 'VALIDATION', 'Field "amount" must be a positive number.');
  }

  const base = {
    description,
    amount,
    category_id: categoryId || null,
  };

  // Try fk columns and payer columns (tolerant)
  const candidates = [
    { divvy_id: divvyId, paid_by_user_id: user.id },
    { group_id: divvyId, paid_by_user_id: user.id },
    { divvyId: divvyId, paid_by_user_id: user.id },
    { divvy_id: divvyId, user_id: user.id },
    { group_id: divvyId, user_id: user.id },
  ];

  let created: any = null;
  let lastCreateErr: any = null;

  for (const extra of candidates) {
    const { data, error: insErr } = await supabase
      .from(table)
      .insert([{ ...base, ...extra }])
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
      'Failed to create expense (schema mismatch likely).',
      { table, lastCreateErr }
    );
  }

  return NextResponse.json({ ok: true, userId: user.id, table, expense: created });
}
