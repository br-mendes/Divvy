import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

type SupabaseAny = any;

type MembershipShape = {
  table: string;
  groupIdCol: string;
  userIdCol: string;
  roleCol?: string;
};

async function pickMembershipShape(supabase: SupabaseAny): Promise<MembershipShape | null> {
  const candidates: MembershipShape[] = [
    { table: "divvy_members", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },
    { table: "divvy_members", groupIdCol: "group_id", userIdCol: "user_id", roleCol: "role" },
    { table: "divvymembers", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },
    { table: "group_members", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },
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

async function ownerFallbackGroups(supabase: SupabaseAny, userId: string) {
  // tenta colunas “donas” comuns em divvies
  const ownerCols = ["created_by", "owner_id", "user_id", "createdBy"] as const;

  for (const col of ownerCols) {
    const { data, error } = await supabase
      .from("divvies")
      .select("*")
      .eq(col as any, userId)
      .order("created_at", { ascending: false });

    if (!error) {
      return { groups: data ?? [], note: `Fallback by divvies.${col}` };
    }
  }

  return { groups: [], note: "No memberships and no owner-column fallback matched." };
}

async function insertDivvy(supabase: SupabaseAny, payload: any) {
  const { data, error } = await supabase.from("divvies").insert(payload).select("id").single();
  if (error) throw error;
  if (!data?.id) throw new Error("Insert succeeded but no id returned");
  return { id: data.id as string };
}

async function ensureMembership(supabase: SupabaseAny, divvyId: string, userId: string, shape: MembershipShape | null) {
  // 1) tenta RPC (se existir)
  const { error: rpcErr } = await supabase.rpc("ensure_divvy_membership", {
    p_divvy_id: divvyId,
    p_role: "owner",
  });

  if (!rpcErr) return { ok: true, via: "rpc" as const };

  // 2) fallback: insert direto na tabela (se existir)
  if (shape) {
    const row: any = {
      [shape.groupIdCol]: divvyId,
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

  // garante que "divvies" realmente existe (se não existir, retorna vazio sem quebrar)
  const { error: probeErr } = await supabase.from("divvies").select("id").limit(1);
  if (probeErr) {
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: "cookie",
      source: "none",
      note: `Groups table not found: ${probeErr.message}`,
      meta: { membershipError: null, membershipTable: null, membershipCount: 0 },
      debug: { userId: user.id, groupsTable: "divvies" },
    });
  }

  const membershipShape = await pickMembershipShape(supabase);

  if (membershipShape) {
    const membership = await listMembershipIds(supabase, membershipShape, user.id);

    if (membership.ids.length > 0) {
      const { data: groups, error: groupsErr } = await supabase
        .from("divvies")
        .select("*")
        .in("id", membership.ids)
        .order("created_at", { ascending: false });

      if (groupsErr) {
        return NextResponse.json(
          { ok: false, code: "DB_ERROR", message: groupsErr.message, meta: membership.meta },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        groups: groups ?? [],
        authMode: "cookie",
        source: "divvies",
        meta: membership.meta,
        debug: { userId: user.id, groupsTable: "divvies", membershipShape },
      });
    }

    // membershipCount = 0 -> fallback por “dono”
    const fb = await ownerFallbackGroups(supabase, user.id);
    return NextResponse.json({
      ok: true,
      groups: fb.groups,
      authMode: "cookie",
      source: "divvies",
      note: `No memberships for this user. ${fb.note}`,
      meta: membership.meta,
      debug: { userId: user.id, groupsTable: "divvies", membershipShape },
    });
  }

  // Sem membership table -> fallback por “dono”
  const fb = await ownerFallbackGroups(supabase, user.id);
  return NextResponse.json({
    ok: true,
    groups: fb.groups,
    authMode: "cookie",
    source: "divvies",
    note: `No membership table found. ${fb.note}`,
    meta: { membershipError: null, membershipTable: null, membershipCount: 0 },
    debug: { userId: user.id, groupsTable: "divvies", membershipShape: null },
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

  // 1) Caminho preferido: RPC (contorna RLS e já cria membership)
  const { data: divvyId, error: rpcErr } = await supabase.rpc("create_divvy", { p_name: name });

  if (!rpcErr && divvyId) {
    return NextResponse.json({
      ok: true,
      group: { id: divvyId, name },
      table: "divvies",
      via: "rpc:create_divvy",
      debug: { userId: user.id },
    });
  }

  // 2) Fallback (caso a RPC ainda não exista por algum motivo)
  // tenta insert direto incluindo owner_id para bater com policies que você possa criar
  try {
    const { data, error } = await supabase
      .from("divvies")
      .insert({ name, owner_id: user.id })
      .select("id")
      .single();

    if (error) throw error;

    // tenta garantir membership (se existir)
    await supabase
      .from("divvy_members")
      .insert({ divvy_id: data.id, user_id: user.id, role: "owner" });

    return NextResponse.json({
      ok: true,
      group: { id: data.id, name },
      table: "divvies",
      via: "fallback:direct_insert",
      warning: rpcErr ? rpcErr.message : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        code: "CREATE_GROUP_FAILED",
        message: e?.message ?? "Unknown error",
        rpcError: rpcErr?.message ?? null,
      },
      { status: 500 }
    );
  }
}
