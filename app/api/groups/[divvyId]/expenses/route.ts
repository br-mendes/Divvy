import { NextResponse } from "next/server";
import { getAuthedSupabase } from "@/lib/supabase/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: { divvyId: string } }) {
  const auth = await getAuthedSupabase(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  // ✅ Por enquanto: devolve vazio, mas autenticado (tira o 401 da tela)
  return NextResponse.json({
    ok: true,
    divvyId: ctx.params.divvyId,
    expenses: [],
    note: "stub-auth-fixed",
    authMode: auth.mode,
  });
}
