import { NextResponse } from 'next/server';

export type AnyRow = Record<string, any>;

export type MembershipShape = {
  table: string;
  groupIdCol: string;
  userIdCol: string;
  roleCol?: string;
  joinedAtCol?: string;
  emailCol?: string;
};

export const MEMBERSHIP_SHAPES: MembershipShape[] = [
  { table: 'divvy_members', groupIdCol: 'divvy_id', userIdCol: 'user_id', roleCol: 'role', joinedAtCol: 'created_at' },
  { table: 'divvymembers', groupIdCol: 'divvyid', userIdCol: 'userid', roleCol: 'role', joinedAtCol: 'joinedat', emailCol: 'email' },
  { table: 'divvy_memberships', groupIdCol: 'divvy_id', userIdCol: 'user_id', roleCol: 'role', joinedAtCol: 'created_at' },
  { table: 'group_members', groupIdCol: 'group_id', userIdCol: 'user_id', roleCol: 'role', joinedAtCol: 'created_at' },
];

export type GroupShape = {
  table: 'divvies' | 'groups';
  idCol: string;
  ownerCol: string;
  select: string;
};

export const GROUP_SHAPES: GroupShape[] = [
  { table: 'divvies', idCol: 'id', ownerCol: 'creatorid', select: 'id,name,description,type,creatorid,created_at,createdat' },
  { table: 'divvies', idCol: 'id', ownerCol: 'owner_id', select: 'id,name,description,type,owner_id,created_at,createdat' },
  { table: 'groups', idCol: 'id', ownerCol: 'creatorid', select: 'id,name,description,type,creatorid,created_at,createdat' },
  { table: 'groups', idCol: 'id', ownerCol: 'owner_id', select: 'id,name,description,type,owner_id,created_at,createdat' },
];

export async function tryQuery<T>(fn: () => Promise<{ data: T | null; error: any }>) {
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

export function jsonError(status: number, code: string, message: string, extra?: any) {
  return NextResponse.json(
    { ok: false, code, message, ...(extra ? { extra } : {}) },
    { status }
  );
}

export async function getGroupRow(supabase: any, divvyId: string) {
  let lastErr: any = null;
  for (const s of GROUP_SHAPES) {
    const { data, error } = await supabase.from(s.table).select(s.select).eq(s.idCol, divvyId).maybeSingle();
    if (!error) {
      if (!data) return { ok: false as const, status: 404 as const, error: null, shape: s, group: null };
      return { ok: true as const, status: 200 as const, error: null, shape: s, group: data as AnyRow };
    }
    lastErr = error;
  }
  return { ok: false as const, status: 500 as const, error: lastErr, shape: null as any, group: null };
}

export async function getMembershipRow(supabase: any, divvyId: string, userId: string) {
  let lastErr: any = null;

  for (const s of MEMBERSHIP_SHAPES) {
    const sel = ['id', s.groupIdCol, s.userIdCol, s.roleCol, s.joinedAtCol, s.emailCol].filter(Boolean).join(',');
    const { data, error } = await supabase
      .from(s.table)
      .select(sel)
      .eq(s.groupIdCol, divvyId)
      .eq(s.userIdCol, userId)
      .maybeSingle();

    if (!error) {
      return { ok: Boolean(data), row: data as AnyRow | null, shape: s, error: null };
    }

    lastErr = error;
  }

  return { ok: false, row: null, shape: null as any, error: lastErr };
}

export async function requireMemberOrCreator(supabase: any, divvyId: string, userId: string) {
  const g = await getGroupRow(supabase, divvyId);
  if (!g.ok) {
    return { ok: false as const, error: g.status === 404 ? jsonError(404, 'NOT_FOUND', 'Group not found') : jsonError(500, 'DB_ERROR', g.error?.message ?? 'Failed to load group') };
  }

  const ownerId = String(g.group?.[g.shape.ownerCol] ?? '');
  const isCreator = ownerId && ownerId === userId;
  const mem = await getMembershipRow(supabase, divvyId, userId);
  const isMember = Boolean(mem.ok);

  if (!isCreator && !isMember) {
    return { ok: false as const, error: jsonError(403, 'FORBIDDEN', 'Forbidden', { membershipError: mem.error?.message }) };
  }

  const roleRaw = (mem.row?.[mem.shape?.roleCol ?? 'role'] ?? '').toString();
  const role = roleRaw || (isCreator ? 'owner' : 'member');
  const isAdmin = isCreator || ['owner', 'admin'].includes(role);

  return {
    ok: true as const,
    group: g.group,
    groupShape: g.shape,
    membership: mem.row,
    membershipShape: mem.shape,
    role,
    isCreator,
    isAdmin,
  };
}

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}
