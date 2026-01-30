import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

type Supa = ReturnType<typeof createRouteHandlerClient>;
type AnyRow = Record<string, any>;

function pickFirst(...values: Array<string | undefined | null>) {
  for (const v of values) {
    const s = (v ?? '').toString().trim();
    if (s) return s;
  }
  return '';
}

async function tryQuery<T>(fn: () => Promise<{ data: T | null; error: any }>) {
  try {
    const r = await fn();
    if (!r.error) return { ok: true as const, data: r.data };
    const msg = String(r.error?.message || '').toLowerCase();
    const retry = msg.includes('does not exist') || msg.includes('relation') || msg.includes('schema cache');
    return { ok: false as const, data: null, retry, error: r.error };
  } catch (e: any) {
    return { ok: false as const, data: null, retry: true as const, error: e };
  }
}

async function getUser(supabase: Supa) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

type MembershipShape = {
  table: string;
  groupIdCol: string;
  userIdCol: string;
  roleCol?: string;
  createdAtCol?: string;
};

const MEMBERSHIP_SHAPES: MembershipShape[] = [
  { table: 'divvy_members', groupIdCol: 'divvy_id', userIdCol: 'user_id', roleCol: 'role', createdAtCol: 'created_at' },
  { table: 'divvymembers', groupIdCol: 'divvyid', userIdCol: 'userid', roleCol: 'role', createdAtCol: 'createdat' },
  { table: 'divvy_memberships', groupIdCol: 'divvy_id', userIdCol: 'user_id', roleCol: 'role', createdAtCol: 'created_at' },
  { table: 'group_members', groupIdCol: 'group_id', userIdCol: 'user_id', roleCol: 'role', createdAtCol: 'created_at' },
];

async function listMembershipGroupIds(supabase: Supa, userId: string) {
  let lastErr: any = null;

  for (const s of MEMBERSHIP_SHAPES) {
    const select = [s.groupIdCol, s.roleCol, s.createdAtCol].filter(Boolean).join(',');

    const { data, error } = await supabase
      .from(s.table)
      .select(select)
      .eq(s.userIdCol, userId);

    if (!error) {
      const rows = (data ?? []) as AnyRow[];
      const ids = rows.map((r) => r?.[s.groupIdCol]).filter(Boolean).map(String);
      return { ok: true as const, ids, via: s.table, shape: s, error: null };
    }

    lastErr = error;
  }

  return { ok: false as const, ids: [] as string[], via: 'unknown', shape: null as any, error: lastErr };
}

type GroupsTableShape = {
  table: 'divvies' | 'groups';
  select: string;
  idCol: string;
  ownerCol: string;
  createdCol?: string;
};

const GROUPS_SHAPES: GroupsTableShape[] = [
  { table: 'divvies', select: 'id,name,type,creatorid,created_at', idCol: 'id', ownerCol: 'creatorid', createdCol: 'created_at' },
  { table: 'divvies', select: 'id,name,type,owner_id,created_at', idCol: 'id', ownerCol: 'owner_id', createdCol: 'created_at' },
  { table: 'divvies', select: 'id,name,type,creatorid,createdat', idCol: 'id', ownerCol: 'creatorid', createdCol: 'createdat' },
  { table: 'groups', select: 'id,name,type,creatorid,created_at', idCol: 'id', ownerCol: 'creatorid', createdCol: 'created_at' },
  { table: 'groups', select: 'id,name,type,owner_id,created_at', idCol: 'id', ownerCol: 'owner_id', createdCol: 'created_at' },
];

async function pickFirstWorkingGroupsShape(supabase: Supa) {
  for (const s of GROUPS_SHAPES) {
    const r = await tryQuery(() => supabase.from(s.table).select(s.select).limit(1));
    if (r.ok) return s;
  }
  return null;
}

async function ensureMembership(supabase: Supa, userId: string, divvyId: string, role: string) {
<<<<<<< HEAD
=======
  // 1) prefer security definer RPC if available
>>>>>>> 3742ed0ae9e93e68ce111148d75a3f9568b2e852
  const rpc = await tryQuery(() =>
    supabase.rpc('ensure_divvy_membership', {
      p_divvy_id: divvyId,
      p_role: role,
    }) as any
  );
  if (rpc.ok) return { ok: true as const, via: 'rpc:ensure_divvy_membership' };

<<<<<<< HEAD
=======
  // 2) fallback: insert into first membership table that exists
>>>>>>> 3742ed0ae9e93e68ce111148d75a3f9568b2e852
  for (const s of MEMBERSHIP_SHAPES) {
    const exists = await tryQuery(() => supabase.from(s.table).select('id').limit(1));
    if (!exists.ok) continue;

    const payload: AnyRow = {
      [s.groupIdCol]: divvyId,
      [s.userIdCol]: userId,
    };
    if (s.roleCol) payload[s.roleCol] = role;

    const ins = await tryQuery(() => supabase.from(s.table).insert(payload as any) as any);
    if (ins.ok) return { ok: true as const, via: `insert:${s.table}`, warning: rpc.error?.message ? { code: 'RPC_FAILED_USED_FALLBACK', message: String(rpc.error.message) } : null };

    const msg = String((ins as any).error?.message ?? '').toLowerCase();
    if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('unique')) {
      return { ok: true as const, via: `exists:${s.table}`, warning: rpc.error?.message ? { code: 'RPC_FAILED_USED_FALLBACK', message: String(rpc.error.message) } : null };
    }
  }

  return {
    ok: false as const,
    via: 'none',
    warning: {
      code: 'MEMBERSHIP_NOT_CREATED',
      message: `RPC error: ${String((rpc as any).error?.message ?? '')}`,
    },
  };
}

export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const user = await getUser(supabase);

    if (!user) {
      return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' }, { status: 401 });
    }

    const membership = await listMembershipGroupIds(supabase, user.id);
    const shape = await pickFirstWorkingGroupsShape(supabase);

    if (!shape) {
      return NextResponse.json({
        ok: true,
        groups: [],
        authMode: 'cookie',
        source: 'none',
        note: 'No groups table found (tried divvies, groups).',
        debug: { membership: membership.ok ? { via: membership.via, count: membership.ids.length } : { error: membership.error?.message } },
      });
    }

<<<<<<< HEAD
=======
    // Prefer membership ids; fallback to owner column.
>>>>>>> 3742ed0ae9e93e68ce111148d75a3f9568b2e852
    if (membership.ok && membership.ids.length > 0) {
      const { data, error } = await supabase
        .from(shape.table)
        .select(shape.select)
        .in(shape.idCol, membership.ids)
        .order(shape.createdCol ?? shape.idCol, { ascending: false });

      if (error) {
        return NextResponse.json(
          { ok: false, code: 'DB_ERROR', message: error.message, debug: { table: shape.table, select: shape.select } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        groups: data ?? [],
        authMode: 'cookie',
        source: shape.table,
        note: `Fetched by memberships (${membership.via})`,
      });
    }

    const { data, error } = await supabase
      .from(shape.table)
      .select(shape.select)
      .eq(shape.ownerCol, user.id)
      .order(shape.createdCol ?? shape.idCol, { ascending: false });

    if (error) {
<<<<<<< HEAD
=======
      // Non-fatal: return empty with debug.
>>>>>>> 3742ed0ae9e93e68ce111148d75a3f9568b2e852
      return NextResponse.json({
        ok: true,
        groups: [],
        authMode: 'cookie',
        source: shape.table,
        note: `No memberships found; fallback by ${shape.table}.${shape.ownerCol} failed.`,
        debug: { error: error.message, membership: membership.ok ? { via: membership.via, count: membership.ids.length } : { error: membership.error?.message } },
      });
    }

    return NextResponse.json({
      ok: true,
      groups: data ?? [],
      authMode: 'cookie',
      source: shape.table,
      note: `No memberships found; fallback by ${shape.table}.${shape.ownerCol}`,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        code: 'UNHANDLED_ERROR',
        message: e?.message || 'Unhandled error',
        stack: process.env.NODE_ENV === 'production' ? undefined : String(e?.stack || ''),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const user = await getUser(supabase);

    if (!user) {
      return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const name = (body?.name ?? body?.title ?? 'Novo grupo').toString().trim();
    const type = pickFirst(body?.type, body?.kind, 'trip');

<<<<<<< HEAD
=======
    // Insert into the first working groups table.
>>>>>>> 3742ed0ae9e93e68ce111148d75a3f9568b2e852
    const groupsCandidates: Array<{ table: 'divvies' | 'groups'; payloads: AnyRow[] }> = [
      {
        table: 'divvies',
        payloads: [
          { name, type, creatorid: user.id },
          { name, type, owner_id: user.id },
          { name },
        ],
      },
      {
        table: 'groups',
        payloads: [
          { name, type, creatorid: user.id },
          { name, type, owner_id: user.id },
          { name },
        ],
      },
    ];

    let created: { id: string; table: string; usedKeys: string[] } | null = null;
    let lastErr: any = null;

    for (const t of groupsCandidates) {
      for (const p of t.payloads) {
        const { data, error } = await supabase.from(t.table).insert(p as any).select('id').single();
        if (!error && data?.id) {
          created = { id: String((data as any).id), table: t.table, usedKeys: Object.keys(p) };
          break;
        }
        lastErr = error;
      }
      if (created) break;
    }

    if (!created) {
      return NextResponse.json(
        { ok: false, code: 'CREATE_GROUP_FAILED', message: lastErr?.message ?? 'Failed to insert group' },
        { status: 500 }
      );
    }

    const ensured = await ensureMembership(supabase, user.id, created.id, 'owner');

    return NextResponse.json({
      ok: true,
      group: { id: created.id },
      table: created.table,
      debug: { usedKeys: created.usedKeys },
      ...(ensured.ok ? {} : { warning: ensured.warning }),
      ...(ensured.ok && ensured.warning ? { warning: ensured.warning } : {}),
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        code: 'UNHANDLED_ERROR',
        message: e?.message || 'Unhandled error',
        stack: process.env.NODE_ENV === 'production' ? undefined : String(e?.stack || ''),
      },
      { status: 500 }
    );
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 3742ed0ae9e93e68ce111148d75a3f9568b2e852
