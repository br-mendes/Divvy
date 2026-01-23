import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

type MembershipShape = {
  table: string;
  groupIdCol: string;
  userIdCol: string;
  roleCol?: string;
};

function isDebug(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get("debug") === "1" || req.headers.get("x-divvy-debug") === "1";
}

async function getAuthedUser(supabase: any) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return { user: null, error: error?.message ?? "Unauthenticated" };
  return { user: data.user, error: null };
}

async function pickMembershipTable(supabase: any): Promise<MembershipShape | null> {
  const candidates: MembershipShape[] = [
    { table: "divvy_members", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },
    { table: "divvymembers", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },
  ];

  for (const shape of candidates) {
    const { error } = await supabase.from(shape.table).select(shape.groupIdCol).limit(1);
    if (!error) return shape;
  }
  return null;
}

async function pickGroupsTable(supabase: any): Promise<string | null> {
  const candidates = ["divvies", "groups"] as const;
  for (const t of candidates) {
    const { error } = await supabase.from(t).select("id").limit(1);
    if (!error) return t;
  }
  return null;
}

async function listGroupIdsByMembership(supabase: any, userId: string, shape: MembershipShape) {
  const sel = [shape.groupIdCol, shape.roleCol].filter(Boolean).join(", ");
  const { data, error } = await supabase.from(shape.table).select(sel).eq(shape.userIdCol, userId);

  if (error) return { ids: [] as string[], error: error.message, rows: [] as any[] };

  const rows = data ?? [];
  const ids = rows.map((r: any) => r?.[shape.groupIdCol]).filter(Boolean) as string[];
  return { ids, error: null as string | null, rows };
}

async function listGroupsByIds(supabase: any, table: string, ids: string[]) {
  // ✅ REMOVIDO updated_at (não existe no seu schema)
  const selectCols = "id, name, type, creatorid, created_at";

  const { data, error } = await supabase
    .from(table)
    .select(selectCols)
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) return { groups: [] as any[], error: error.message };
  return { groups: data ?? [], error: null as string | null };
}

async function listGroupsByCreatorFallback(supabase: any, userId: string) {
  const selectCols = "id, name, type, creatorid, created_at";

  const { data, error } = await supabase
    .from("divvies")
    .select(selectCols)
    .eq("creatorid", userId)
    .order("created_at", { ascending: false });

  if (error) return { groups: [] as any[], error: error.message };
  return { groups: data ?? [], error: null as string | null };
}

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const debugOn = isDebug(req);

  const { user, error: authError } = await getAuthedUser(supabase);
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: authError },
      { status: 401 }
    );
  }

  const groupsTable = (await pickGroupsTable(supabase)) ?? "divvies";
  const membershipShape = await pickMembershipTable(supabase);
const meta: any = {
    membershipError: null as string | null,
    membershipTable: membershipShape?.table ?? null,
    membershipCount: 0,
  };

  // 1) Tenta memberships -> grupos
  if (membershipShape) {
    const membership = await listGroupIdsByMembership(supabase, user.id, membershipShape);
    meta.membershipError = membership.error;
    meta.membershipCount = membership.ids.length;

    if (membership.ids.length > 0) {
      const res = await listGroupsByIds(supabase, groupsTable, membership.ids);
      if (res.error) {
        return NextResponse.json(
          {
            ok: false,
            code: "DB_ERROR",
            message: res.error,
            meta,
            debug: debugOn ? { userId: user.id, groupsTable, membershipShape } : undefined,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        groups: res.groups,
        authMode: "cookie",
        source: groupsTable,
        meta,
        debug: debugOn ? { userId: user.id, groupsTable, membershipShape } : undefined,
      });
    }
  }

  const fallback = await listGroupsByCreatorFallback(supabase, user.id);

  return NextResponse.json({
    ok: true,
    groups: fallback.groups,
    authMode: "cookie",
    source: "divvies",
    note: membershipShape
      ? "No memberships for this user. Fallback by divvies.creatorid"
      : "No membership table found. Fallback by divvies.creatorid",
    meta,
    debug: debugOn ? { userId: user.id, groupsTable, membershipShape } : undefined,
  });
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const debugOn = isDebug(req);

  const { user, error: authError } = await getAuthedUser(supabase);
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: authError },
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

  // Caminho correto: RPC security definer (cria divvy + membership)
  const { data: newId, error: rpcErr } = await supabase.rpc("create_divvy", { p_name: name });

  if (rpcErr || !newId) {
    return NextResponse.json(
      {
        ok: false,
        code: "CREATE_GROUP_FAILED",
        message: rpcErr?.message ?? "RPC create_divvy failed",
        hint: "Verifique se public.create_divvy(text) existe e tem GRANT EXECUTE para authenticated.",
        debug: debugOn ? { userId: user.id } : undefined,
      },
      { status: 500 }
    );
  }

  // Busca o registro (sem updated_at)
  const { data: group, error: fetchErr } = await supabase
    .from("divvies")
    .select("id, name, type, creatorid, created_at")
    .eq("id", newId)
    .single();

  return NextResponse.json({
    ok: true,
    group: fetchErr ? { id: newId } : group,
    id: newId,
    debug: debugOn ? { userId: user.id, fetched: !fetchErr } : undefined,
  });
}
