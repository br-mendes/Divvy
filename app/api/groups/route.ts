import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

async function ensureMembership(opts: {
  supabase: any; // cookie client
  admin: any | null; // service role client
  userId: string;
  divvyId: string;
  role: string;
}) {
  const { supabase, admin, userId, divvyId, role } = opts;

  // 1) tenta via RPC (se existir)
  const { error: rpcErr } = await supabase.rpc("ensure_divvy_membership", {
    p_divvy_id: divvyId,
    p_role: role,
  });

  if (!rpcErr) return { ok: true, mode: "rpc" as const };

  // 2) fallback: insert direto usando service role (não depende de RLS)
  if (admin) {
    const { error: insErr } = await admin
      .from("divvy_members")
      .insert({ divvy_id: divvyId, user_id: userId, role })
      .select("divvy_id")
      .single();

    if (!insErr) return { ok: true, mode: "admin_insert" as const };
    return { ok: false, mode: "admin_insert" as const, error: insErr.message, rpcError: rpcErr.message };
  }

  // 3) sem service role: tenta insert normal (pode falhar por RLS)
  const { error: insErr2 } = await supabase
    .from("divvy_members")
    .insert({ divvy_id: divvyId, user_id: userId, role });

  if (!insErr2) return { ok: true, mode: "insert" as const };
  return { ok: false, mode: "insert" as const, error: insErr2.message, rpcError: rpcErr.message };
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

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const admin = getAdminClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" },
      { status: 401 }
    );
  }

  const user = authData.user;

  // usa admin para leitura (se existir) -> não depende de RLS/policies
  const readClient = admin ?? supabase;

  const membership = await listMembershipDivvyIds(readClient, user.id);
  const divvyIds = membership.ids;

  const groupsTable = await pickGroupsTable(readClient);
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

  const { data: groups, error: groupsErr } = await readClient
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
  const admin = getAdminClient();

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

  // payload tolerante
  const basePayload: any = { name };

  try {
    // cria grupo usando admin se existir (evita RLS quebrar create)
    const createClient = admin ?? supabase;
    const created = await insertGroup(createClient, basePayload);

    // garante membership do criador (robusto)
    const membershipRes = await ensureMembership({
      supabase,
      admin,
      userId: user.id,
      divvyId: created.id,
      role: "owner",
    });

    if (!membershipRes.ok) {
      return NextResponse.json({
        ok: true,
        group: { id: created.id },
        table: created.table,
        warning: {
          code: "MEMBERSHIP_NOT_CREATED",
          message: membershipRes.error ?? "membership failed",
          rpcError: membershipRes.rpcError,
          mode: membershipRes.mode,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      group: { id: created.id },
      table: created.table,
      membership: { ok: true, mode: membershipRes.mode },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "CREATE_GROUP_FAILED", message: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
