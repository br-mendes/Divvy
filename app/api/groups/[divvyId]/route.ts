import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

type Supa = ReturnType<typeof createRouteHandlerClient>;

type MembershipShape = {
  table: string;
  groupIdCol: string;
  userIdCol: string;
  roleCol?: string;
  joinedAtCol?: string;
};

const MEMBERSHIP_SHAPES: MembershipShape[] = [
  { table: 'divvy_members', groupIdCol: 'divvy_id', userIdCol: 'user_id', roleCol: 'role', joinedAtCol: 'created_at' },
  { table: 'divvymembers', groupIdCol: 'divvyid', userIdCol: 'userid', roleCol: 'role', joinedAtCol: 'joinedat' },
  { table: 'divvy_memberships', groupIdCol: 'divvy_id', userIdCol: 'user_id', roleCol: 'role', joinedAtCol: 'created_at' },
  { table: 'group_members', groupIdCol: 'group_id', userIdCol: 'user_id', roleCol: 'role', joinedAtCol: 'created_at' },
];

async function getUser(supabase: Supa) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function isMember(supabase: Supa, userId: string, divvyId: string) {
  for (const s of MEMBERSHIP_SHAPES) {
    const { data, error } = await supabase
      .from(s.table)
      .select('id')
      .eq(s.groupIdCol, divvyId)
      .eq(s.userIdCol, userId)
      .maybeSingle();

    if (!error) return Boolean(data);
  }
  return false;
}

async function listMembers(supabase: Supa, divvyId: string) {
  let lastErr: any = null;

  for (const s of MEMBERSHIP_SHAPES) {
    const select = [
      'id',
      s.groupIdCol,
      s.userIdCol,
      s.roleCol,
      s.joinedAtCol,
    ]
      .filter(Boolean)
      .join(',');

    const { data, error } = await supabase
      .from(s.table)
      .select(select)
      .eq(s.groupIdCol, divvyId);

    if (!error) {
      const rows = (data ?? []) as any[];
      const ids = Array.from(new Set(rows.map((r) => String(r?.[s.userIdCol] ?? '')).filter(Boolean)));

      // Best-effort profile lookup for emails.
      const profilesById = new Map<string, any>();
      if (ids.length > 0) {
        const p1 = await supabase.from('userprofiles').select('id,email').in('id', ids);
        if (!p1.error && Array.isArray(p1.data)) {
          for (const p of p1.data as any[]) profilesById.set(String(p.id), p);
        } else {
          const p2 = await supabase.from('user_profiles').select('id,email').in('id', ids);
          if (!p2.error && Array.isArray(p2.data)) {
            for (const p of p2.data as any[]) profilesById.set(String(p.id), p);
          }
        }
      }

      const members = rows.map((r) => {
        const userId = String(r?.[s.userIdCol] ?? '');
        const roleRaw = s.roleCol ? String(r?.[s.roleCol] ?? '') : '';
        const role = (roleRaw || 'member') as any;
        const joinedAt = s.joinedAtCol ? (r?.[s.joinedAtCol] ?? null) : null;
        const email = profilesById.get(userId)?.email || null;

        return {
          id: String(r?.id ?? ''),
          userid: userId,
          email,
          role,
          joinedat: joinedAt,
        };
      });

      return { ok: true as const, members, via: s.table };
    }

    lastErr = error;
  }

  return { ok: false as const, members: [] as any[], via: 'unknown', error: lastErr };
}

type GroupShape = {
  table: 'divvies' | 'groups';
  select: string;
  ownerCol: string;
};

const GROUP_SHAPES: GroupShape[] = [
  { table: 'divvies', select: 'id,name,type,creatorid,created_at', ownerCol: 'creatorid' },
  { table: 'divvies', select: 'id,name,type,owner_id,created_at', ownerCol: 'owner_id' },
  { table: 'divvies', select: 'id,name,type,creatorid,createdat', ownerCol: 'creatorid' },
  { table: 'groups', select: 'id,name,type,creatorid,created_at', ownerCol: 'creatorid' },
  { table: 'groups', select: 'id,name,type,owner_id,created_at', ownerCol: 'owner_id' },
];

export async function GET(_req: Request, ctx: { params: { divvyId: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const user = await getUser(supabase);

    if (!user) {
      return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' }, { status: 401 });
    }

    const divvyId = ctx.params.divvyId;
    if (!divvyId) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Missing divvyId param.' }, { status: 400 });
    }

    let lastErr: any = null;
    for (const s of GROUP_SHAPES) {
      const { data, error } = await supabase.from(s.table).select(s.select).eq('id', divvyId).maybeSingle();
      if (error) {
        lastErr = error;
        continue;
      }

      if (!data) {
        return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Group not found' }, { status: 404 });
      }

      const ownerId = (data as any)?.[s.ownerCol] ? String((data as any)[s.ownerCol]) : '';
      const allowed = ownerId === user.id || (await isMember(supabase, user.id, divvyId));

      if (!allowed) {
        return NextResponse.json({ ok: false, code: 'FORBIDDEN', message: 'Forbidden' }, { status: 403 });
      }

      const membersRes = await listMembers(supabase, divvyId);

      return NextResponse.json({
        ok: true,
        group: data,
        members: membersRes.ok ? membersRes.members : [],
        authMode: 'cookie',
        userId: user.id,
        source: s.table,
        debug: {
          membersVia: membersRes.via,
          membersError: membersRes.ok ? null : membersRes.error?.message,
        },
      });
    }

    return NextResponse.json(
      { ok: false, code: 'DB_ERROR', message: lastErr?.message ?? 'Failed to read group' },
      { status: 500 }
    );
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
