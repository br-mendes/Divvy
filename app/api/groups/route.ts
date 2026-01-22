import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type MembershipShape = {
  table: string;
  groupIdCol: string;
  userIdCol: string;
  roleCol?: string;
};

function getAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getAnonClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!url || !anon) return null;

  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getAuthedUser(supabaseCookie: any, req: Request) {
  // 1) tenta cookie
  const cookieRes = await supabaseCookie.auth.getUser();
  if (!cookieRes.error && cookieRes.data?.user) {
    return { user: cookieRes.data.user, mode: "cookie" as const, error: null };
  }

  // 2) tenta bearer token
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1]?.trim();

  if (!token) {
    return { user: null, mode: "none" as const, error: cookieRes.error?.message || "No auth" };
  }

  const anon = getAnonClient();
  if (!anon) {
    return { user: null, mode: "none" as const, error: "Missing SUPABASE URL/ANON env for bearer auth" };
  }

  const bearerRes = await anon.auth.getUser(token);
  if (bearerRes.error || !bearerRes.data?.user) {
    return { user: null, mode: "none" as const, error: bearerRes.error?.message || "Invalid bearer token" };
  }

  return { user: bearerRes.data.user, mode: "bearer" as const, error: null };
}

async function pickGroupsTable(supabase: any) {
  const candidates = ["divvies", "groups"] as const;

  for (const table of candidates) {
    const { error } = await supabase.from(table).select("id").limit(1);

    // sem erro => ok
    if (!error) return table;

    // Se deu "permission denied" / RLS, a tabela existe. Ainda assim escolhemos,
    // pq o problema então é policy — mas pelo menos sabemos o nome.
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("permission denied") || msg.includes("rls")) return table;
  }

  return null;
}

async function pickMembershipShape(supabase: any): Promise<MembershipShape | null> {
  const candidates: MembershipShape[] = [
    { table: "divvy_members", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },
    { table: "divvymembers", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },
    { table: "group_members", groupIdCol: "group_id", userIdCol: "user_id", roleCol: "role" },
    { table: "groups_members", groupIdCol: "group_id", userIdCol: "user_id", roleCol: "role" },
    { table: "memberships", groupIdCol: "group_id", userIdCol: "user_id", roleCol: "role" },
  ];

  for (const c of candidates) {
    const { error } = await supabase.from(c.table).select(c.groupIdCol).limit(1);
    if (!error) return c;

    const msg = (error.message || "").toLowerCase();

    // tabela existe mas sem permissão => escolhe mesmo assim (vai precisar policy/admin)
    if (msg.includes("permission denied") || msg.includes("rls")) return c;

    // se a coluna não existir, tenta próximo candidato
    // (ex.: "column ... does not exist")
  }

  return null;
}

async function listMembershipIds(supabase: any, shape: MembershipShape, userId: string) {
  const selectCols = [shape.groupIdCol, shape.roleCol, "created_at"].filter(Boolean).join(", ");
  const { data, error } = await supabase
    .from(shape.table)
    .select(selectCols)
    .eq(shape.userIdCol, userId);

  if (error) {
    return { ids: [] as string[], error: error.message, rows: [] as any[] };
  }

  const ids = (data ?? [])
    .map((r: any) => r?.[shape.groupIdCol])
    .filter(Boolean) as string[];

  return { ids, error: null as string | null, rows: data ?? [] };
}

async function insertGroup(supabase: any, payload: any) {
  const tryTables = ["divvies", "groups"] as const;

  let lastErr: any = null;
  for (const table of tryTables) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select("id")
      .single();

    if (!error && data?.id) return { id: data.id as string, table };
    lastErr = error;
  }
  throw lastErr ?? new Error("Failed to insert group");
}

async function ensureMembership(opts: {
  supabaseCookie: any;
  admin: any | null;
  shape: MembershipShape | null;
  userId: string;
  groupId: string;
  role: string;
}) {
  const { supabaseCookie, admin, shape, userId, groupId, role } = opts;

  // 1) tenta RPC (2 assinaturas possíveis)
  {
    const r1 = await supabaseCookie.rpc("ensure_divvy_membership", {
      p_divvy_id: groupId,
      p_role: role,
    });
    if (!r1.error) return { ok: true, mode: "rpc(p_divvy_id,p_role)" as const };

    const r2 = await supabaseCookie.rpc("ensure_divvy_membership", {
      p_divvy_id: groupId,
      p_user_id: userId,
      p_role: role,
    });
    if (!r2.error) return { ok: true, mode: "rpc(+p_user_id)" as const };
  }

  if (!shape) {
    return { ok: false, mode: "no_membership_table" as const, error: "No membership table found." };
  }

  const row: any = {
    [shape.groupIdCol]: groupId,
    [shape.userIdCol]: userId,
  };
  if (shape.roleCol) row[shape.roleCol] = role;

  // 2) tenta admin insert (se existir)
  if (admin) {
    const { error } = await admin.from(shape.table).insert(row);
    if (!error) return { ok: true, mode: "admin_insert" as const };
    return { ok: false, mode: "admin_insert" as const, error: error.message };
  }

  // 3) fallback insert normal (pode falhar em RLS)
  const { error } = await supabaseCookie.from(shape.table).insert(row);
  if (!error) return { ok: true, mode: "insert" as const };
  return { ok: false, mode: "insert" as const, error: error.message };
}

export async function GET(req: Request) {
  const supabaseCookie = createRouteHandlerClient({ cookies });
  const admin = getAdminClient();

  const auth = await getAuthedUser(supabaseCookie, req);
  if (!auth.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: auth.error || "You must be logged in" },
      { status: 401 }
    );
  }

  const debug = new URL(req.url).searchParams.get("debug") === "1";

  // leitura: preferir admin
  const readClient = admin ?? supabaseCookie;

  const membershipShape = await pickMembershipShape(readClient);
  const groupsTable = await pickGroupsTable(readClient);

  if (!groupsTable) {
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: auth.mode,
      source: "none",
      note: "No groups table found (checked: divvies, groups).",
      debug: debug
        ? { admin: !!admin, membershipShape, groupsTable }
        : undefined,
    });
  }

  if (!membershipShape) {
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: auth.mode,
      source: groupsTable,
      note: "No membership table matched.",
      debug: debug
        ? { admin: !!admin, membershipShape, groupsTable }
        : undefined,
    });
  }

  const membership = await listMembershipIds(readClient, membershipShape, auth.user.id);

  if (membership.ids.length === 0) {
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: auth.mode,
      source: groupsTable,
      note: membership.error ? "Membership query failed." : "No memberships for this user.",
      meta: {
        membershipError: membership.error,
        membershipTable: membershipShape.table,
        membershipCount: membership.rows.length,
      },
      debug: debug
        ? {
            admin: !!admin,
            userId: auth.user.id,
            membershipShape,
            groupsTable,
          }
        : undefined,
    });
  }

  const { data: groups, error: groupsErr } = await readClient
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
        debug: debug
          ? {
              admin: !!admin,
              userId: auth.user.id,
              membershipShape,
              groupsTable,
              membershipIdsCount: membership.ids.length,
            }
          : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    groups: groups ?? [],
    authMode: auth.mode,
    source: groupsTable,
    meta: {
      membershipTable: membershipShape.table,
      membershipIdsCount: membership.ids.length,
      admin: !!admin,
    },
  });
}

export async function POST(req: Request) {
  const supabaseCookie = createRouteHandlerClient({ cookies });
  const admin = getAdminClient();

  const auth = await getAuthedUser(supabaseCookie, req);
  if (!auth.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: auth.error || "You must be logged in" },
      { status: 401 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const name = (body?.name ?? body?.title ?? "Novo grupo").toString().trim();
  const payload: any = { name };

  // criação: preferir admin para não depender de RLS
  const createClient = admin ?? supabaseCookie;

  try {
    const created = await insertGroup(createClient, payload);

    // descobrir membership shape (preferir admin)
    const shape = await pickMembershipShape(admin ?? supabaseCookie);

    // garantir membership: se falhar, devolve ERRO (pra você ver)
    const ensured = await ensureMembership({
      supabaseCookie,
      admin,
      shape,
      userId: auth.user.id,
      groupId: created.id,
      role: "owner",
    });

    if (!ensured.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: "MEMBERSHIP_NOT_CREATED",
          message: ensured.error || "Failed to create membership",
          created: { id: created.id, table: created.table },
          membership: { table: shape?.table, mode: ensured.mode },
          admin: !!admin,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      group: { id: created.id },
      table: created.table,
      membership: { ok: true, mode: ensured.mode, table: shape?.table },
      admin: !!admin,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "CREATE_GROUP_FAILED", message: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
