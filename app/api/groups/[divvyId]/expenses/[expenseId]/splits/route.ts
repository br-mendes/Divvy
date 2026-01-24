import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

async function getUser(supabase: any) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function GET(_: Request, ctx: { params: { divvyId: string; expenseId: string } }) {
  const { divvyId, expenseId } = ctx.params;
  const supabase = createRouteHandlerClient({ cookies });

  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" }, { status: 401 });
  }

  // valida que a expense é do divvy (evita leak)
  const { data: exp, error: expErr } = await supabase
    .from("expenses")
    .select("id,divvyid")
    .eq("id", expenseId)
    .eq("divvyid", divvyId)
    .maybeSingle();

  if (expErr) return NextResponse.json({ ok: false, code: "DB_ERROR", message: expErr.message }, { status: 500 });
  if (!exp) return NextResponse.json({ ok: false, code: "NOT_FOUND", message: "Expense not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("expensesplits")
    .select("id,expenseid,userid,amount,paid,createdat,updatedat")
    .eq("expenseid", expenseId)
    .order("createdat", { ascending: true, nullsFirst: true });

  if (error) {
    return NextResponse.json({ ok: false, code: "DB_ERROR", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, divvyId, expenseId, splits: data ?? [] });
}
