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

export async function PUT(req: Request, ctx: { params: { divvyId: string; expenseId: string } }) {
  const supabase = createRouteHandlerClient2({ cookies: cookies2 });
  const user = await getUser2(supabase);

  if (!user) {
    return NextResponse2.json({ ok: false, code: 'UNAUTHENTICATED', message: 'You must be logged in' }, { status: 401 });
  }

  const { divvyId, expenseId } = ctx.params;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Load expense and validate it belongs to divvy.
  const attempts = [
    { sel: 'id,divvyid,paidbyuserid,amount,category,description,title,date,locked', divvyCol: 'divvyid' },
    { sel: 'id,divvy_id,paidbyuserid,amount,category,description,title,date,locked', divvyCol: 'divvy_id' },
  ] as const;

  let exp: any = null;
  let divvyCol: string | null = null;
  let lastErr: any = null;

  for (const a of attempts) {
    const { data, error } = await supabase.from('expenses').select(a.sel).eq('id', expenseId).maybeSingle();
    if (!error && data) {
      exp = data as any;
      divvyCol = a.divvyCol;
      break;
    }
    lastErr = error;
  }

  if (!exp || !divvyCol) {
    return NextResponse2.json(
      { ok: false, code: 'DB_ERROR', message: lastErr?.message ?? 'Failed to load expense', where: 'expense_get' },
      { status: 500 }
    );
  }

  if (String(exp[divvyCol] ?? '') !== String(divvyId)) {
    return NextResponse2.json({ ok: false, code: 'NOT_FOUND', message: 'Expense not found' }, { status: 404 });
  }

  if (Boolean(exp.locked)) {
    return NextResponse2.json({ ok: false, code: 'LOCKED', message: 'Expense is locked' }, { status: 409 });
  }

  const amount = body?.amount !== undefined ? Number(body.amount) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount <= 0)) {
    return NextResponse2.json({ ok: false, code: 'BAD_REQUEST', message: 'Invalid amount' }, { status: 400 });
  }

  const category = body?.category !== undefined ? String(body.category ?? '').trim() : null;
  const description = body?.description !== undefined || body?.title !== undefined ? String(body.description ?? body.title ?? '').trim() : null;
  const date = body?.date !== undefined ? String(body.date ?? '').trim() : null;
  const payerId = String(body?.paidByUserId ?? body?.paidbyuserid ?? exp.paidbyuserid ?? '').trim();

  const now = new Date().toISOString();

  const patches: any[] = [];
  const base: any = {};
  if (amount !== null) base.amount = amount;
  if (category !== null) base.category = category;
  if (date !== null) base.date = date;
  if (payerId) base.paidbyuserid = payerId;
  base.updatedat = now;
  base.updated_at = now;

  if (description !== null) {
    patches.push({ ...base, description });
    patches.push({ ...base, title: description });
  } else {
    patches.push(base);
  }

  let updatedExpense: any = null;
  let updErr: any = null;

  for (const p of patches) {
    const { data, error } = await supabase.from('expenses').update(p).eq('id', expenseId).select('*').maybeSingle();
    if (!error) {
      updatedExpense = data;
      updErr = null;
      break;
    }
    updErr = error;
  }

  if (updErr) {
    return NextResponse2.json(
      { ok: false, code: 'DB_ERROR', message: updErr.message, where: 'expense_update' },
      { status: 500 }
    );
  }

  // Optional: replace splits
  const splits = Array.isArray(body?.splits) ? body.splits : null;
  if (splits) {
    interface SplitItem {
      userid: string;
      amountowed: number;
    }

    const normalized: SplitItem[] = splits.map((s: any) => {
      const userid = String(s.participantuserid ?? s.participantUserId ?? s.userid ?? s.userId ?? '').trim();
      let amountowed = Number(s.amountowed ?? s.amountOwed ?? s.amount ?? 0);
      if (!amountowed && s.amountCents !== undefined) amountowed = Number(s.amountCents) / 100;
      return { userid, amountowed };
    });

    const invalid = normalized.some((r: SplitItem) => !r.userid || !(Number.isFinite(r.amountowed) && r.amountowed > 0));
    if (invalid) {
      return NextResponse2.json({ ok: false, code: 'BAD_SPLITS', message: 'Invalid splits payload' }, { status: 400 });
    }

    const total = normalized.reduce((acc, r) => acc + r.amountowed, 0);
    const expAmount = Number(updatedExpense?.amount ?? exp.amount ?? 0);
    if (Math.abs(total - expAmount) > 0.01) {
      return NextResponse2.json(
        { ok: false, code: 'BAD_SPLITS', message: 'Splits sum must equal expense amount' },
        { status: 400 }
      );
    }

    // Try to wipe + insert into known split tables.
    const splitCandidates = [
      {
        table: 'expensesplits',
        del: () => supabase.from('expensesplits').delete().eq('expenseid', expenseId),
        ins: () =>
          supabase
            .from('expensesplits')
            .insert(normalized.map((r) => ({ expenseid: expenseId, participantuserid: r.userid, amountowed: r.amountowed })) as any),
      },
      {
        table: 'expensesplits',
        del: () => supabase.from('expensesplits').delete().eq('expenseid', expenseId),
        ins: () =>
          supabase
            .from('expensesplits')
            .insert(normalized.map((r) => ({ expenseid: expenseId, userid: r.userid, amount: r.amountowed })) as any),
      },
      {
        table: 'expense_splits',
        del: () => supabase.from('expense_splits').delete().eq('expense_id', expenseId),
        ins: () =>
          supabase
            .from('expense_splits')
            .insert(normalized.map((r) => ({ expense_id: expenseId, user_id: r.userid, amount_cents: Math.round(r.amountowed * 100) })) as any),
      },
    ] as const;

    let splitError: any = null;
    let wrote = false;
    for (const c of splitCandidates) {
      const test = await supabase.from(c.table).select('id').limit(1);
      if (test.error) {
        splitError = test.error;
        continue;
      }

      const del = await c.del();
      if (del.error) {
        splitError = del.error;
        continue;
      }

      const ins = await c.ins();
      if (!ins.error) {
        wrote = true;
        splitError = null;
        break;
      }
      splitError = ins.error;
    }

    if (!wrote && splitError) {
      return NextResponse2.json({ ok: false, code: 'DB_ERROR', message: splitError.message, where: 'splits_update' }, { status: 500 });
    }
  }

  return NextResponse2.json({ ok: true, expense: updatedExpense ?? exp });
}
