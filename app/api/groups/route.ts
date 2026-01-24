import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

type AnySupabase = any;

function pickFirst(...values: Array<string | undefined | null>) {
  for (const v of values) {
    const s = (v ?? "").toString().trim();
    if (s) return s;
  }
  return "";
}

async function tableExists(supabase: AnySupabase, table: string) {
  const { error } = await supabase.from(table).select("id").limit(1);
  return !error;
}

async function pickGroupsTable(supabase: AnySupabase) {
  // seu ambiente mostrou "divvies" existindo; "groups" pode não existir
  const candidates = ["divvies", "groups"] as const;
  for (const t of candidates) {
    if (await tableExists(supabase, t)) return t;
  }
  return null;
}

async function listMembershipDivvyIds(supabase: AnySupabase, userId: string) {
  // shape confirmado no debug: divvy_members(divvy_id, user_id, role, ...)
  const membershipTable = "divvy_members";
  const groupIdCol = "divvy_id";
  const userIdCol = "user_id";

  const { data, error } = await supabase
    .from(membershipTable)
    .select(`${groupIdCol}, role, created_at`)
    .eq(userIdCol, userId);

  if (error) {
    return {
      ids: [] as string[],
      meta: { membershipError: error.message, membershipTable, membershipCount: 0 },
      debug: { membershipTable, groupIdCol, userIdCol },
    };
  }

  const ids = (data ?? []).map((r: any) => r?.[groupIdCol]).filter(Boolean) as string[];

  return {
    ids,
    meta: { membershipError: null, membershipTable, membershipCount: ids.length },
    debug: { membershipTable, groupIdCol, userIdCol },
  };
}

async function ensureMembership(supabase: AnySupabase, divvyId: string) {
  // 1) tenta RPC security definer (recomendado)
  const { error: rpcErr } = await supabase.rpc("ensure_divvy_membership", {
    p_divvy_id: divvyId,
    p_role: "owner",
  });

  if (!rpcErr) return { ok: true as const };

  // 2) fallback: insert direto (pode falhar por RLS — então vira warning)
  const { error: insErr } = await supabase
    .from("divvy_members")
    .insert({ divvy_id: divvyId, role: "owner" });

  if (!insErr) return { ok: true as const, warning: { code: "RPC_FAILED_USED_FALLBACK", message: rpcErr.message } };

  return {
    ok: false as const,
    warning: {
      code: "MEMBERSHIP_NOT_CREATED",
      message: `RPC error: ${rpcErr.message} | insert error: ${insErr.message}`,
    },
  };
}

async function insertGroup(supabase: AnySupabase, payload: any) {
  const tryTables = ["divvies", "groups"] as const;
  let lastErr: any = null;

  for (const table of tryTables) {
    // tenta inserir com payload completo
    const r1 = await supabase.from(table).insert(payload).select("id").single();
    if (!r1.error && r1.data?.id) return { id: r1.data.id as string, table };

    lastErr = r1.error;

    // fallback: remove campos que podem não existir
    const minimal = { name: payload?.name };
    const r2 = await supabase.from(table).insert(minimal).select("id").single();
    if (!r2.error && r2.data?.id) return { id: r2.data.id as string, table };

    lastErr = r2.error;
  }

  throw lastErr ?? new Error("Failed to insert group");
}

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" },
      { status: 401 }
    );
  }

  const user = authData.user;

  // 1) memberships
  const membership = await listMembershipDivvyIds(supabase, user.id);

  // 2) groups table
  const groupsTable = await pickGroupsTable(supabase);
  if (!groupsTable) {
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: "cookie",
      source: "none",
      note: "No groups table found (checked: divvies, groups).",
      meta: membership.meta,
      debug: { userId: user.id, membershipShape: membership.debug },
    });
  }

  const select = "id,name,type,creatorid,created_at";

  // 3) busca por memberships
  if (membership.ids.length > 0) {
    const { data: groups, error: groupsErr } = await supabase
      .from(groupsTable)
      .select(select)
      .in("id", membership.ids)
      .order("created_at", { ascending: false });

    if (groupsErr) {
      return NextResponse.json(
        {
          ok: false,
          code: "DB_ERROR",
          message: groupsErr.message,
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
      note: "Fetched by memberships",
      meta: membership.meta,
    });
  }

  // 4) fallback por creatorid (quando membership ainda não foi criada, ou RLS bloqueou leitura do membership)
  const { data: owned, error: ownedErr } = await supabase
    .from(groupsTable)
    .select(select)
    .eq("creatorid", user.id)
    .order("created_at", { ascending: false });

  if (ownedErr) {
    // sem erro fatal — devolve vazio com debug
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: "cookie",
      source: groupsTable,
      note: "No memberships for this user. Fallback by divvies.creatorid (failed).",
      meta: membership.meta,
      debug: { userId: user.id, error: ownedErr.message },
    });
  }

  return NextResponse.json({
    ok: true,
    groups: owned ?? [],
    authMode: "cookie",
    source: groupsTable,
    note: "No memberships for this user. Fallback by divvies.creatorid",
    meta: membership.meta,
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

  // seu banco já tem NOT NULL em divvies.type -> default seguro: "trip"
  const type = pickFirst(body?.type, body?.kind, "trip");

  // payload principal compatível com seu schema atual
  const payload = {
    name,
    type,
    creatorid: user.id,
  };

  try {
    const created = await insertGroup(supabase, payload);

    const membership = await ensureMembership(supabase, created.id);

    return NextResponse.json({
      ok: true,
      group: { id: created.id },
      table: created.table,
      ...(membership.ok ? {} : { warning: membership.warning }),
      ...(membership.ok && membership.warning ? { warning: membership.warning } : {}),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "CREATE_GROUP_FAILED", message: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
