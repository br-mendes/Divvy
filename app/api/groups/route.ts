import { NextResponse } from "next/server";
import { getAuthedSupabase } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, any>;

function pickFirst(...values: Array<string | undefined | null>) {
  for (const v of values) {
    const s = (v ?? "").toString().trim();
    if (s) return s;
  }
  return "";
}

async function tableExists(supabase: any, table: string) {
  const { error } = await supabase.from(table).select("*").limit(1);
  return !error;
}

async function safeSelectDivvies(supabase: any, where: { ids?: string[]; creatorid?: string }) {
  // tentativas de shape (pra não quebrar se alguma coluna não existir)
  const selects = [
    "id,name,type,creatorid,created_at",
    "id,name,creatorid,created_at",
    "id,name,type,created_at",
    "id,name,created_at",
    "id,name",
  ];

  let lastErr: any = null;

  for (const sel of selects) {
    let q = supabase.from("divvies").select(sel);

    if (where.ids?.length) q = q.in("id", where.ids);
    if (where.creatorid) q = q.eq("creatorid", where.creatorid);

    // ordenar só por created_at (se não existir, a tentativa falha e cai no próximo select)
    const { data, error } = await q.order("created_at", { ascending: false });

    if (!error) return { ok: true as const, data: (data ?? []) as AnyRow[], select: sel };
    lastErr = error;
  }

  return { ok: false as const, error: lastErr };
}

async function listMembershipDivvyIds(supabase: any, userId: string) {
  // tenta ler membership — se policy estiver ok, teremos ids
  const { data, error } = await supabase
    .from("divvy_members")
    .select("divvy_id, role, created_at")
    .eq("user_id", userId);

  if (error) {
    return { ids: [] as string[], meta: { membershipError: error.message, membershipCount: 0 } };
  }

  const ids = (data ?? [])
    .map((r: any) => r?.divvy_id)
    .filter((v: any) => typeof v === "string" && v.length > 0);

  return { ids, meta: { membershipError: null, membershipCount: ids.length } };
}

export async function GET(req: Request) {
  const auth = await getAuthedSupabase(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const { supabase, user, mode } = auth;

  // garante que "divvies" existe
  const hasDivvies = await tableExists(supabase, "divvies");
  if (!hasDivvies) {
    return NextResponse.json({
      ok: true,
      groups: [],
      authMode: mode,
      note: "Table divvies not found.",
      debug: auth.debug,
    });
  }

  // 1) tenta membership
  let membership = { ids: [] as string[], meta: { membershipError: null as string | null, membershipCount: 0 } };
  const hasMembership = await tableExists(supabase, "divvy_members");

  if (hasMembership) {
    membership = await listMembershipDivvyIds(supabase, user.id);
  } else {
    membership.meta = { membershipError: "divvy_members table not found", membershipCount: 0 };
  }

  // 2) se tiver ids, busca por ids
  if (membership.ids.length > 0) {
    const byIds = await safeSelectDivvies(supabase, { ids: membership.ids });
    if (!byIds.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: "DB_ERROR",
          message: byIds.error?.message ?? "Failed to fetch groups by membership ids",
          meta: { ...membership.meta, membershipTable: "divvy_members" },
          debug: { authMode: mode, userId: user.id, tried: "membership->divvies.in(id)" },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      groups: byIds.data,
      authMode: mode,
      source: "divvies",
      note: "Fetched by memberships",
      meta: { ...membership.meta, membershipTable: "divvy_members" },
      debug: { ...auth.debug, select: byIds.select, userId: user.id, path: "membership" },
    });
  }

  // 3) fallback: grupos criados pelo usuário
  const fallback = await safeSelectDivvies(supabase, { creatorid: user.id });
  if (!fallback.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: "DB_ERROR",
        message: fallback.error?.message ?? "Failed to fetch groups by creatorid fallback",
        meta: { ...membership.meta, membershipTable: "divvy_members" },
        debug: { authMode: mode, userId: user.id, tried: "fallback->divvies.creatorid" },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    groups: fallback.data,
    authMode: mode,
    source: "divvies",
    note: "No memberships for this user. Fallback by divvies.creatorid",
    meta: { ...membership.meta, membershipTable: "divvy_members" },
    debug: { ...auth.debug, select: fallback.select, userId: user.id, path: "creatorid-fallback" },
  });
}

export async function POST(req: Request) {
  const auth = await getAuthedSupabase(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const { supabase, user, mode } = auth;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const name = pickFirst(body?.name, body?.title, "Novo grupo");
  const type = pickFirst(body?.type, "trip"); // seu exemplo real usa "trip"
  const payload = {
    name,
    type,
    creatorid: user.id,
  };

  // cria na tabela "divvies"
  const { data, error } = await supabase.from("divvies").insert(payload).select("id").single();

  if (error || !data?.id) {
    return NextResponse.json(
      {
        ok: false,
        code: "CREATE_GROUP_FAILED",
        message: error?.message ?? "Unknown error",
        debug: { authMode: mode, userId: user.id, payloadKeys: Object.keys(payload) },
      },
      { status: 500 }
    );
  }

  // tenta garantir membership do criador (se existir)
  const { error: rpcErr } = await supabase.rpc("ensure_divvy_membership", {
    p_divvy_id: data.id,
    p_role: "owner",
  });

  return NextResponse.json({
    ok: true,
    group: { id: data.id },
    authMode: mode,
    warning: rpcErr ? { code: "MEMBERSHIP_NOT_CREATED", message: rpcErr.message } : null,
    debug: { ...auth.debug, userId: user.id },
  });
}
