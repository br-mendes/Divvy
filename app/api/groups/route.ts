import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

async function pickGroupsTable(supabase: any) {
  const candidates = ["divvies", "groups"] as const;

  for (const table of candidates) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (!error) return table;
  }

  return null;
}

async function listMembershipDivvyIds(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("divvy_members")
    .select("divvy_id, role, created_at")
    .eq("user_id", userId);

  if (error) {
    return { ids: [] as string[], meta: { membershipError: error.message } };
  }

  const ids = (data ?? [])
    .map((r: any) => r?.divvy_id)
    .filter(Boolean) as string[];

  return { ids, meta: { memberships: data ?? [] } };
}

async function insertGroup(supabase: any, payload: any) {
  // tenta "divvies" primeiro; se não existir, tenta "groups"
  const tryTables = ["divvies", "groups"] as const;

  let lastErr: any = null;

  for (const table of tryTables) {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select("id")
      .single();

    if (!error && data?.id) {
      return { id: data.id as string, table };
    }
    lastErr = error;
  }

  throw lastErr ?? new Error("Failed to insert group");
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

  // 1) memberships do usuário
  const membership = await listMembershipDivvyIds(supabase, user.id);
  const divvyIds = membership.ids;

  // 2) tabela de grupos (divvies|groups)
  const groupsTable = await pickGroupsTable(supabase);
  if (!groupsTable) {
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: "cookie",
      source: "none",
      note: "No groups table found (checked: divvies, groups).",
      meta: membership.meta,
    });
  }

  if (divvyIds.length === 0) {
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: "cookie",
      source: groupsTable,
      note: "No memberships for this user.",
      meta: membership.meta,
    });
  }

  // 3) busca grupos por id
  const { data: groups, error: groupsErr } = await supabase
    .from(groupsTable)
    .select("*")
    .in("id", divvyIds)
    .order("created_at", { ascending: false });

  if (groupsErr) {
    return NextResponse.json(
      {
        ok: false,
        code: "DB_ERROR",
        message: groupsErr.message,
        debug: { table: groupsTable, divvyIdsCount: divvyIds.length },
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

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const name = (body?.name ?? body?.title ?? "Novo grupo").toString().trim();

  // payload “tolerante”: evita passar colunas que podem não existir
  const basePayload: any = { name };

  try {
    const created = await insertGroup(supabase, basePayload);

    // garante membership do criador
    const { error: rpcErr } = await supabase.rpc("ensure_divvy_membership", {
      p_divvy_id: created.id,
      p_role: "owner",
    });

    if (rpcErr) {
      // não quebra o fluxo (grupo foi criado), apenas avisa
      return NextResponse.json({
        ok: true,
        group: { id: created.id },
        table: created.table,
        warning: { code: "MEMBERSHIP_NOT_CREATED", message: rpcErr.message },
      });
    }

    return NextResponse.json({
      ok: true,
      group: { id: created.id },
      table: created.table,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "CREATE_GROUP_FAILED", message: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
