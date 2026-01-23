import { NextResponse } from "next/server";
import { getAuthedSupabase } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: { divvyId: string } }) {
  const auth = await getAuthedSupabase(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const { supabase, user, mode } = auth;
  const divvyId = ctx.params.divvyId;

  const { data: group, error: groupErr } = await supabase
    .from("divvies")
    .select("id, name, type, creatorid, created_at")
    .eq("id", divvyId)
    .maybeSingle();

  if (groupErr) {
    return NextResponse.json({ ok: false, code: "DB_ERROR", message: groupErr.message }, { status: 500 });
  }

  if (!group) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND", message: "Group not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    group,
    authMode: mode,
    userId: user.id,
    debug: auth.debug,
  });
}
