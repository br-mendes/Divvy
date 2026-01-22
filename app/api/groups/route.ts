import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

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
  // mantém o que já existe (se você já tem GET implementado, ignore este stub)
  return NextResponse.json(
    { ok: false, message: "Not implemented in this patch" },
    { status: 501 }
  );
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
  const description = (body?.description ?? "").toString().trim();

  // payload “tolerante” (se sua tabela não tiver description, ela vai ignorar no fallback? não — então usamos só name)
  const basePayload: any = { name };

  // Se você sabe que sua tabela tem outros campos (ex.: currency), adicione aqui:
  // if (body?.currency) basePayload.currency = body.currency;

  try {
    const created = await insertGroup(supabase, basePayload);

    //  garante membership do criador (o que estava faltando)
    const { error: rpcErr } = await supabase.rpc("ensure_divvy_membership", {
      p_divvy_id: created.id,
      p_role: "owner",
    });

    if (rpcErr) {
      // Não quebra o fluxo (grupo criado), mas devolve aviso
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
