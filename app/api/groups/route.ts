import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

type SupabaseAny = any;

async function tableExists(supabase: SupabaseAny, table: string) {
  const { error } = await supabase.from(table).select("id").limit(1);
  return !error;
}

async function pickGroupsTable(supabase: SupabaseAny) {
  for (const t of ["divvies", "groups"] as const) {
    if (await tableExists(supabase, t)) return t;
  }
  return null;
}

type MembershipShape = {
  table: string;
  groupIdCol: string;
  userIdCol: string;
  roleCol?: string;
};

async function pickMembershipShape(supabase: SupabaseAny): Promise<MembershipShape | null> {
  // tenta combinações comuns sem assumir schema
  const candidates: MembershipShape[] = [
    { table: "divvy_members", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },
    { table: "divvy_members", groupIdCol: "group_id", userIdCol: "user_id", roleCol: "role" },
    { table: "group_members", groupIdCol: "group_id", userIdCol: "user_id", roleCol: "role" },
    { table: "divvymembers", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },
  ];

  for (const c of candidates) {
    const { error } = await supabase.from(c.table).select(c.groupIdCol).limit(1);
    if (!error) return c;
  }
  return null;
}

async function listMembershipIds(supabase: SupabaseAny, shape: MembershipShape, userId: string) {
  const { data, error } = await supabase
    .from(shape.table)
    .select(`${shape.groupIdCol}${shape.roleCol ? `, ${shape.roleCol}` : ""}`)
    .eq(shape.userIdCol, userId);

  if (error) {
    return {
      ids: [] as string[],
      meta: { membershipError: error.message, membershipTable: shape.table, membershipCount: 0 },
    };
  }

  const ids = (data ?? [])
    .map((r: any) => r?.[shape.groupIdCol])
    .filter(Boolean) as string[];

  return {
    ids,
    meta: { membershipError: null, membershipTable: shape.table, membershipCount: ids.length },
  };
}

async function ownerFallbackGroups(
  supabase: SupabaseAny,
  groupsTable: string,
  userId: string
): Promise<{ groups: any[]; note: string }> {
  // tenta colunas “donas” comuns sem quebrar
  const ownerCols = ["created_by", "owner_id", "user_id", "createdBy"] as const;

  for (const col of ownerCols) {
    const { data, error } = await supabase
      .from(groupsTable)
      .select("*")
      .eq(col as any, userId)
      .order("created_at", { ascending: false });

    if (!error) {
      return { groups: data ?? [], note: `Fallback by ${groupsTable}.${col}` };
    }
  }

  return { groups: [], note: "No memberships and no owner-column fallback matched." };
}

async function insertGroup(supabase: SupabaseAny, payload: any) {
  const tryTables = ["divvies", "groups"] as const;
  let lastErr: any = null;

  for (const table of tryTables) {
    const { data, error } = await supabase.from(table).insert(payload).select("id").single();
    if (!error && data?.id) return { id: data.id as string, table };
    lastErr = error;
  }

  throw lastErr ?? new Error("Failed to insert group");
}

async function ensureMembership(
  supabase: SupabaseAny,
  groupId: string,
  userId: string,
  shape: MembershipShape | null
) {
  // 1) tenta RPC (se existir)
  const { error: rpcErr } = await supabase.rpc("ensure_divvy_membership", {
    p_divvy_id: groupId,
    p_role: "owner",
  });

  if (!rpcErr) return { ok: true, via: "rpc" as const };

  // 2) fallback: insert direto na tabela (se existir)
  if (shape) {
    const row: any = {
      [shape.groupIdCol]: groupId,
      [shape.userIdCol]: userId,
    };
    if (shape.roleCol) row[shape.roleCol] = "owner";

    const { error: insErr } = await supabase.from(shape.table).insert(row);
    if (!insErr) return { ok: true, via: "direct_insert" as const };
    return { ok: false, via: "direct_insert" as const, error: insErr.message, rpcError: rpcErr.message };
  }

  return { ok: false, via: "rpc" as const, error: rpcErr.message };
}

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" },
      { status: 401 }
    );
  }

  const user = authData.user;

  const groupsTable = await pickGroupsTable(supabase);
  const membershipShape = await pickMembershipShape(supabase);

  if (!groupsTable) {
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: "cookie",
      source: "none",
      note: "No groups table found (checked: divvies, groups).",
      meta: { membershipError: null, membershipTable: null, membershipCount: 0 },
      debug: { admin: true, userId: user.id, groupsTable: null, membershipShape },
    });
  }

  // Se existe membership table, usamos ela como fonte principal
  if (membershipShape) {
    const membership = await listMembershipIds(supabase, membershipShape, user.id);

    if (membership.ids.length > 0) {
      const { data: groups, error: groupsErr } = await supabase
        .from(groupsTable)
        .select("*")
        .in("id", membership.ids)
        .order("created_at", { ascending: false });

      if (groupsErr) {
        return NextResponse.json(
          {
            ok: false,
            code: "DB_ERROR",
            message: groupsErr.message,
            debug: { table: groupsTable, membershipCount: membership.ids.length },
            meta: membership.meta,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        groups: groups ?? [],
        authMode: "cookie",
        source: groupsTable,
        meta: membership.meta,
        debug: { admin: true, userId: user.id, groupsTable, membershipShape },
      });
    }

    // membershipCount = 0 → tenta fallback por colunas de dono, pra não “sumir” grupo
    const fb = await ownerFallbackGroups(supabase, groupsTable, user.id);
    return NextResponse.json({
      ok: true,
      groups: fb.groups,
      authMode: "cookie",
      source: groupsTable,
      note: membership.meta.membershipCount === 0 ? `No memberships for this user. ${fb.note}` : fb.note,
      meta: membership.meta,
      debug: { admin: true, userId: user.id, groupsTable, membershipShape },
    });
  }

  // Sem membership table → fallback por “dono”
  const fb = await ownerFallbackGroups(supabase, groupsTable, user.id);
  return NextResponse.json({
    ok: true,
    groups: fb.groups,
    authMode: "cookie",
    source: groupsTable,
    note: `No membership table found. ${fb.note}`,
    meta: { membershipError: null, membershipTable: null, membershipCount: 0 },
    debug: { admin: true, userId: user.id, groupsTable, membershipShape: null },
  });
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" },
      { status: 401 }
    );
  }

  const user = authData.user;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const name = (body?.name ?? body?.title ?? "Novo grupo").toString().trim();
  const payload: any = { name };

  try {
    const created = await insertGroup(supabase, payload);

    const membershipShape = await pickMembershipShape(supabase);
    const ensured = await ensureMembership(supabase, created.id, user.id, membershipShape);

    return NextResponse.json({
      ok: true,
      group: { id: created.id, name },
      table: created.table,
      membership: ensured,
      debug: { userId: user.id, membershipShape },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "CREATE_GROUP_FAILED", message: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
