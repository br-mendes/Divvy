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

  // leitura via RLS (assume policies ok)
  const { data, error } = await supabase
    .from("expenses")
    .select("id,divvyid,title,description,amount,currency,date,paidbyuserid,categoryid,splitmode,locked,deleted,createdat,updatedat")
    .eq("divvyid", divvyId)
    .eq("id", expenseId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, code: "DB_ERROR", message: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, code: "NOT_FOUND", message: "Expense not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, divvyId, expense: data, authMode: "cookie" });
}

export async function DELETE(_: Request, ctx: { params: { divvyId: string; expenseId: string } }) {
  const { divvyId, expenseId } = ctx.params;
  const supabase = createRouteHandlerClient({ cookies });

  const user = await getUser(supabase);
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" }, { status: 401 });
  }

  // soft delete (schema: deleted boolean)
  const { data, error } = await supabase
    .from("expenses")
    .update({ deleted: true })
    .eq("divvyid", divvyId)
    .eq("id", expenseId)
    .select("id,deleted")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, code: "DB_ERROR", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, divvyId, expenseId, deleted: data?.deleted === true });
}
