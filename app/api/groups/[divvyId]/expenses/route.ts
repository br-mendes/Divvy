import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

type Supa = ReturnType<typeof createRouteHandlerClient>;

function pickFirst<T>(...vals: Array<T | null | undefined>): T | null {
  for (const v of vals) if (v !== null && v !== undefined) return v;
  return null;
}

function isMissingColumnError(msg: string, col: string) {
  // exemplos:
  // "column expenses.title does not exist"
  // "column e.created_at does not exist"
  return msg.toLowerCase().includes(`column`) && msg.toLowerCase().includes(col.toLowerCase()) && msg.toLowerCase().includes("does not exist");
}

async function getAuthedUser(supabase: Supa) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function assertMembership(supabase: Supa, userId: string, divvyId: string) {
  // tenta tabelas de membership conhecidas
  const membershipTables = ["divvy_members", "divvymembers", "divvy_memberships", "group_members"] as const;

  for (const t of membershipTables) {
    const { error } = await supabase.from(t).select("id").eq("divvyid", divvyId).eq("userid", userId).maybeSingle();
    if (!error) {
      // se não deu erro, tabela existe e policy permitiu ler
      // se veio null, pode ser não-membro — ainda assim vamos checar creator fallback fora
      const { data } = await supabase.from(t).select("id").eq("divvyid", divvyId).eq("userid", userId).maybeSingle();
      if (data) return { ok: true as const, via: t };
      return { ok: false as const, via: t };
    }
  }

  // Se nenhuma tabela existe/permitiu select, devolve “desconhecido”
  return { ok: false as const, via: "unknown" as const };
}

async function isCreatorOfDivvy(supabase: Supa, userId: string, divvyId: string) {
  // schema que você mostrou: divvies.creatorid
  const { data, error } = await supabase
    .from("divvies")
    .select("creatorid")
    .eq("id", divvyId)
    .maybeSingle();

  if (error) return false;
  return (data as any)?.creatorid === userId;
}

async function listExpensesTolerant(supabase: Supa, divvyId: string) {
  // vamos tentar uma lista de selects até achar um conjunto compatível com seu banco
  // (pelo doc do projeto, o correto tende a ser: divvyid, paidbyuserid, amount, category, description, date, createdat)
  const candidates = [
    {
      select: "id,divvyid,paidbyuserid,amount,category,description,date,createdat,locked",
      divvyCol: "divvyid",
      createdCol: "createdat",
      descCol: "description",
    },
    {
      select: "id,divvy_id,paidbyuserid,amount,category,description,date,created_at,locked",
      divvyCol: "divvy_id",
      createdCol: "created_at",
      descCol: "description",
    },
    {
      select: "id,divvyid,paidbyuserid,amount,category,title,date,createdat,locked",
      divvyCol: "divvyid",
      createdCol: "createdat",
      descCol: "title",
    },
    {
      select: "id,divvy_id,paidbyuserid,amount,category,title,date,created_at,locked",
      divvyCol: "divvy_id",
      createdCol: "created_at",
      descCol: "title",
    },
  ] as const;

  let lastErr: any = null;

  for (const c of candidates) {
    // order por date e createdCol (se existir)
    let q: any = supabase.from("expenses").select(c.select).eq(c.divvyCol, divvyId);

    // tenta ordenar com createdCol; se falhar, cai pra só date
    q = q.order("date", { ascending: false, nullsFirst: false });

    const { data, error } = await q;
    if (!error) {
      const rows = (data ?? []) as any[];

      return {
        ok: true as const,
        rows: rows.map((r) => ({
          id: r.id,
          divvyId: r[c.divvyCol],
          paidByUserId: r.paidbyuserid ?? null,
          amount: r.amount ?? 0,
          category: r.category ?? null,
          description: r[c.descCol] ?? "",
          date: r.date ?? null,
          createdAt: r[c.createdCol] ?? null,
          locked: r.locked ?? false,
        })),
        meta: {
          divvyCol: c.divvyCol,
          createdCol: c.createdCol,
          descCol: c.descCol,
          select: c.select,
        },
      };
    }

    lastErr = error;
    // segue tentando os próximos
  }

  return { ok: false as const, error: lastErr };
}

async function insertExpenseAndSplitsTolerant(supabase: Supa, userId: string, divvyId: string, body: any) {
  const amount = Number(body?.amount ?? 0);
  const category = (body?.category ?? "").toString().trim();
  const description = (body?.description ?? body?.title ?? "").toString().trim();
  const date = (body?.date ?? "").toString().trim();

  const splits = Array.isArray(body?.splits) ? body.splits : [];

  if (!divvyId || !amount || !category || !date || splits.length === 0) {
    return {
      ok: false as const,
      status: 400,
      payload: { ok: false, code: "BAD_REQUEST", message: "Campos obrigatórios faltando (divvyId, amount, category, date, splits[])." },
    };
  }

  // tenta inserir com colunas conhecidas
  const expensePayloadCandidates = [
    // schema do doc
    { divvyid: divvyId, paidbyuserid: userId, amount, category, description, date },
    // caso seu banco use divvy_id
    { divvy_id: divvyId, paidbyuserid: userId, amount, category, description, date },
    // caso seja title em vez de description
    { divvyid: divvyId, paidbyuserid: userId, amount, category, title: description, date },
    { divvy_id: divvyId, paidbyuserid: userId, amount, category, title: description, date },
  ] as const;

  let createdExpense: any = null;
  let insertMeta: any = null;
  let lastErr: any = null;

  for (const payload of expensePayloadCandidates) {
    const { data, error } = await supabase.from("expenses").insert(payload as any).select("*").single();
    if (!error && data?.id) {
      createdExpense = data;
      insertMeta = { usedPayloadKeys: Object.keys(payload) };
      break;
    }
    lastErr = error;
  }

  if (!createdExpense?.id) {
    return {
      ok: false as const,
      status: 500,
      payload: { ok: false, code: "DB_ERROR", message: lastErr?.message ?? "Falha ao criar expense", where: "expenses_insert" },
    };
  }

  // tenta inserir splits (schema do doc: expenseid, participantuserid, amountowed)
  const splitRows = splits.map((s: any) => ({
    expenseid: createdExpense.id,
    participantuserid: (s.userid ?? s.userId ?? s.participantUserId ?? "").toString(),
    amountowed: Number(s.amount ?? s.amountOwed ?? 0),
  }));

  const invalid = splitRows.some((r) => !r.participantuserid || !r.amountowed);
  if (invalid) {
    // rollback best-effort
    await supabase.from("expenses").delete().eq("id", createdExpense.id);
    return {
      ok: false as const,
      status: 400,
      payload: { ok: false, code: "BAD_SPLITS", message: "splits inválidos. Use { userid, amount } em cada item." },
    };
  }

  const { error: splitErr } = await supabase.from("expensesplits").insert(splitRows as any);

  if (splitErr) {
    // rollback best-effort
    await supabase.from("expenses").delete().eq("id", createdExpense.id);
    return {
      ok: false as const,
      status: 500,
      payload: { ok: false, code: "DB_ERROR", message: splitErr.message, where: "expensesplits_insert" },
    };
  }

  return {
    ok: true as const,
    status: 201,
    payload: {
      ok: true,
      expense: createdExpense,
      meta: { insertMeta, splitsInserted: splitRows.length },
    },
  };
}

export async function GET(_: Request, ctx: { params: { divvyId: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const user = await getAuthedUser(supabase);

  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" }, { status: 401 });
  }

  const divvyId = ctx.params.divvyId;

  // authz: membro OU creator
  const mem = await assertMembership(supabase, user.id, divvyId);
  const creator = mem.ok ? false : await isCreatorOfDivvy(supabase, user.id, divvyId);

  if (!mem.ok && !creator) {
    return NextResponse.json({ ok: false, code: "FORBIDDEN", message: "Forbidden" }, { status: 403 });
  }

  const list = await listExpensesTolerant(supabase, divvyId);
  if (!list.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: "DB_ERROR",
        message: list.error?.message ?? "Failed to list expenses",
        where: "expenses_list",
        meta: { membership: mem, creator },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    divvyId,
    expenses: list.rows,
    authMode: "cookie",
    debug: {
      userId: user.id,
      membership: mem,
      creator,
      select: list.meta.select,
      cols: list.meta,
      count: list.rows.length,
    },
  });
}

export async function POST(req: Request, ctx: { params: { divvyId: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const user = await getAuthedUser(supabase);

  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" }, { status: 401 });
  }

  const divvyId = ctx.params.divvyId;

  // precisa ser membro (policy de insert em expenses normalmente exige membership)
  const mem = await assertMembership(supabase, user.id, divvyId);
  if (!mem.ok) {
    // se for creator mas não membro, normalmente ainda falha na policy; então retornamos instrução clara
    const creator = await isCreatorOfDivvy(supabase, user.id, divvyId);
    return NextResponse.json(
      {
        ok: false,
        code: "FORBIDDEN",
        message: creator
          ? "Você é creator, mas não consta como membro. Crie/garanta membership do creator em divvy_members/divvymembers."
          : "Forbidden",
        debug: { membership: mem, creator },
      },
      { status: 403 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const created = await insertExpenseAndSplitsTolerant(supabase, user.id, divvyId, body);
  return NextResponse.json(created.payload, { status: created.status });
}
