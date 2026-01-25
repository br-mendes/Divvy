import { NextResponse as NextResponse2 } from "next/server";
import { cookies as cookies2 } from "next/headers";
import { createRouteHandlerClient as createRouteHandlerClient2 } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

async function getUser2(supabase: any) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function GET(_: Request, ctx: { params: { divvyId: string; expenseId: string } }) {
  const supabase = createRouteHandlerClient2({ cookies: cookies2 });
  const user = await getUser2(supabase);

  if (!user) {
    return NextResponse2.json({ ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" }, { status: 401 });
  }

  const { divvyId, expenseId } = ctx.params;

  // tenta ler o expense com colunas que existirem
  const attempts = [
    { sel: "id,divvyid,paidbyuserid,amount,category,description,date,createdat,locked", divvyCol: "divvyid" },
    { sel: "id,divvy_id,paidbyuserid,amount,category,description,date,created_at,locked", divvyCol: "divvy_id" },
    { sel: "id,divvyid,paidbyuserid,amount,category,title,date,createdat,locked", divvyCol: "divvyid" },
    { sel: "id,divvy_id,paidbyuserid,amount,category,title,date,created_at,locked", divvyCol: "divvy_id" },
  ] as const;

  let lastErr: any = null;
  for (const a of attempts) {
    const { data, error } = await supabase.from("expenses").select(a.sel).eq("id", expenseId).maybeSingle();
    if (!error && data) {
      const row: any = data;
      // garante que pertence ao divvy do path (evita leak)
      if (String(row[a.divvyCol] ?? "") !== String(divvyId)) {
        return NextResponse2.json({ ok: false, code: "NOT_FOUND", message: "Expense not found" }, { status: 404 });
      }
      return NextResponse2.json({ ok: true, expense: row, authMode: "cookie", userId: user.id });
    }
    lastErr = error;
  }

  return NextResponse2.json(
    { ok: false, code: "DB_ERROR", message: lastErr?.message ?? "Failed to load expense", where: "expense_get" },
    { status: 500 }
  );
}

export async function DELETE(_: Request, ctx: { params: { divvyId: string; expenseId: string } }) {
  const supabase = createRouteHandlerClient2({ cookies: cookies2 });
  const user = await getUser2(supabase);

  if (!user) {
    return NextResponse2.json({ ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" }, { status: 401 });
  }

  const { expenseId } = ctx.params;

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) {
    return NextResponse2.json(
      { ok: false, code: "DB_ERROR", message: error.message, where: "expense_delete" },
      { status: 500 }
    );
  }

  return NextResponse2.json({ ok: true });
}
