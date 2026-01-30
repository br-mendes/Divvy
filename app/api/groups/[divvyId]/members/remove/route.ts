import { NextResponse } from 'next/server';

import { requireUser } from '@/app/api/_utils/supabase';
import { MEMBERSHIP_SHAPES, requireMemberOrCreator, tryQuery } from '@/app/api/_utils/divvy';

export const dynamic = 'force-dynamic';

type RequestShape = {
  table: string;
  divvyCol: string;
  typeCol: string;
  statusCol: string;
  requestedByCol: string;
  targetUserCol: string;
  reasonCol?: string;
  createdAtCol?: string;
};

const REQUEST_TABLES: RequestShape[] = [
  {
    table: 'divvy_requests',
    divvyCol: 'divvyid',
    typeCol: 'type',
    statusCol: 'status',
    requestedByCol: 'requested_by',
    targetUserCol: 'target_userid',
    reasonCol: 'reason',
    createdAtCol: 'createdat',
  },
  {
    table: 'requests',
    divvyCol: 'divvyid',
    typeCol: 'type',
    statusCol: 'status',
    requestedByCol: 'requested_by',
    targetUserCol: 'target_userid',
    reasonCol: 'reason',
    createdAtCol: 'createdat',
  },
];

async function pickRequestTable(supabase: any) {
  for (const s of REQUEST_TABLES) {
    const r = await tryQuery(() => supabase.from(s.table).select('id').limit(1));
    if (r.ok) return s;
  }
  return null;
}

export async function POST(req: Request, ctx: { params: { divvyId: string } }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const { supabase, user } = auth;
  const divvyId = ctx.params.divvyId;

  const perm = await requireMemberOrCreator(supabase, divvyId, user.id);
  if (!perm.ok) return perm.error;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const userIdToRemove = String(body?.userIdToRemove ?? '').trim();
  const reason = String(body?.reason ?? '').trim();

  if (!userIdToRemove) {
    return NextResponse.json({ ok: false, error: 'Missing userIdToRemove' }, { status: 400 });
  }

  if (userIdToRemove === user.id) {
    return NextResponse.json({ ok: false, error: 'Use /api/groups/leave to leave a group.' }, { status: 400 });
  }

  // Admins/owners can remove directly.
  if (perm.isAdmin) {
    for (const s of MEMBERSHIP_SHAPES) {
      const exists = await tryQuery(() => supabase.from(s.table).select('id').limit(1));
      if (!exists.ok) continue;

      const del = await supabase
        .from(s.table)
        .delete()
        .eq(s.groupIdCol, divvyId)
        .eq(s.userIdCol, userIdToRemove);

      if (!del.error) {
        return NextResponse.json({ ok: true, action: 'removed', via: s.table });
      }
    }

    return NextResponse.json({ ok: false, error: 'Failed to remove member (membership table not found or blocked).' }, { status: 500 });
  }

  // Non-admin: create a request.
  const reqTable = await pickRequestTable(supabase);
  if (!reqTable) {
    return NextResponse.json({ ok: false, error: 'Requests are not available (no requests table found).' }, { status: 501 });
  }

  const now = new Date().toISOString();
  const payload: any = {
    [reqTable.divvyCol]: divvyId,
    [reqTable.typeCol]: 'remove_member',
    [reqTable.statusCol]: 'pending',
    [reqTable.requestedByCol]: user.id,
    [reqTable.targetUserCol]: userIdToRemove,
  };
  if (reqTable.reasonCol) payload[reqTable.reasonCol] = reason || null;
  if (reqTable.createdAtCol) payload[reqTable.createdAtCol] = now;

  const { data, error } = await supabase.from(reqTable.table).insert(payload).select('*').single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, action: 'requested', request: data });
}
