import { NextResponse } from "next/server";
import { getAuthedSupabase } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: { divvyId: string } }) {
  const auth = await getAuthedSupabase(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const { supabase, user, mode } = auth;
  const divvyId = ctx.params.divvyId;

  // Verifica membership (se existir tabela) — se falhar, ainda tenta buscar o grupo (pra debug)
  let isMember = false;
  const memTry = await supabase
    .from("divvy_members")
    .select("divvy_id")
    .eq("divvy_id", divvyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!memTry.error && memTry.data) isMember = true;

  // Busca grupo na divvies
  const { data: group, error: groupErr } = await supabase
    .from("divvies")
    .select("id, name, type, creatorid, created_at")
    .eq("id", divvyId)
    .maybeSingle();

  if (groupErr) {
    return NextResponse.json(
      { ok: false, code: "DB_ERROR", message: groupErr.message },
      { status: 500 }
    );
  }

  if (!group) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Group not found" },
      { status: 404 }
    );
  }

  // Se existe membership table e não é membro, bloqueia
  // (se a tabela não existir ou deu erro, não bloqueia aqui — deixa RLS decidir)
  if (!memTry.error && !isMember) {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", message: "You are not a member of this group" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    group,
    authMode: mode,
    member: isMember,
  });
}
