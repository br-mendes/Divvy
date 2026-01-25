import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

type Supa = ReturnType<typeof createRouteHandlerClient>;

function pickFirst<T>(...vals: Array<T | null | undefined>): T | null {
  for (const v of vals) if (v !== null && v !== undefined) return v;
  return null;
}

async function getAuthedUser(supabase: Supa) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

type MembershipShape = {
  table: string;
  groupIdCol: string;
  userIdCol: string;
  roleCol?: string;
};

const MEMBERSHIP_SHAPES: MembershipShape[] = [
  // seu caso mais provável (você já citou divvy_members)
  { table: "divvy_members", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },

  // variações comuns
  { table: "divvymembers", groupIdCol: "divvyid", userIdCol: "userid", roleCol: "role" },
  { table: "divvy_memberships", groupIdCol: "divvy_id", userIdCol: "user_id", roleCol: "role" },
  { table: "group_members", groupIdCol: "group_id", userIdCol: "user_id", roleCol: "role" },
];

async function assertMembership(supabase: Supa, userId: string, divvyId: string) {
  // tenta shape por shape; se tabela não existir ou policy bloquear select, segue tentando
  let lastErr: any = null;

  for (const s of MEMBERSHIP_SHAPES) {
    const { data, error } = await supabase
      .from(s.table)
      .select("id")
      .eq(s.groupIdCol, divvyId)
      .eq(s.userIdCol, userId)
      .maybeSingle();

    if (!error) {
      return {
        ok: !!data,
        via: s.table,
        shape: s,
        error: null,
      };
    }

    lastErr = error;
  }

  return {
    ok: false,
    via: "unknown",
    shape: null as any,
    error: lastErr?.message ?? "membership lookup failed",
  };
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

async function tryEnsureMembership(supabase: Supa, divvyId: string, role: string) {
  // 1) tenta RPC (se existir no seu DB)
  //    (se não existir, vai falhar com “function does not exist” e seguimos)
  try {
    const { error: rpcErr } = await supabase.rpc("ensure_divvy_membership", {
      p_divvy_id: divvyId,
      p_role: role,
    });
    if (!rpcErr) {
      return { ok: true as const, via: "rpc:ensure_divvy_membership" };
    }
  } catch {
    // ignora
  }

  // 2) tenta inserir direto na tabela de membership mais provável
  //    primeiro escolhe a primeira tabela que “existe” (select limit 1)
  for (const s of MEMBERSHIP_SHAPES) {
    const { error: existsErr } = await supabase.from(s.table).select("id").limit(1);
    if (existsErr) continue;

    const payload: any = {
      [s.groupIdCol]: divvyId,
      [s.userIdCol]: (await supabase.auth.getUser()).data.user?.id ?? null,
    };
    if (s.roleCol) payload[s.roleCol] = role;

    // insert best-effort (se policy impedir, vai falhar)
    const { error: insErr } = await supabase.from(s.table).insert(payload);

    if (!insErr) return { ok: true as const, via: `insert:${s.table}` };

    // se já existe (constraint), consideramos ok
    const msg = (insErr.message ?? "").toLowerCase();
    if (msg.includes("duplicate") || msg.includes("already exists") || msg.includes("unique")) {
      return { ok: true as const, via: `exists:${s.table}` };
    }

    // se falhou por policy, segue tentando outras tabelas
  }

  return { ok: false as const, via: "none" };
}

async function listExpensesTolerant(supabase: Supa, divvyId: string) {
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
    const q: any = supabase
      .from("expenses")
      .select(c.select)
      .eq(c.divvyCol, divvyId)
      .order("date", { ascending: false, nullsFirst: false });

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
        meta: c,
      };
    }

    lastErr = error;
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
      payload: {
        ok: false,
        code: "BAD_REQUEST",
        message: "Campos obrigatórios faltando (divvyId, amount, category, date, splits[]).",
      },
    };
  }

  const expensePayloadCandidates = [
    { divvyid: divvyId, paidbyuserid: userId, amount, category, description, date },
    { divvy_id: divvyId, paidbyuserid: userId, amount, category, description, date },
    { divvyid: divvyId, paidbyuserid: userId, amount, category, title: description, date },
    { divvy_id: divvyId, paidbyuserid: userId, amount, category, title: description, date },
  ] as const;

  let createdExpense: any = null;
  let lastErr: any = null;
  let insertMeta: any = null;

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

  const splitRows = splits.map((s: any) => ({
    expenseid: createdExpense.id,
    participantuserid: (s.userid ?? s.userId ?? s.participantUserId ?? "").toString(),
    amountowed: Number(s.amount ?? s.amountOwed ?? 0),
  }));

  const invalid = splitRows.some((r) => !r.participantuserid || !r.amountowed);
  if (invalid) {
    await supabase.from("expenses").delete().eq("id", createdExpense.id);
    return {
      ok: false as const,
      status: 400,
      payload: { ok: false, code: "BAD_SPLITS", message: "splits inválidos. Use { userid, amount } em cada item." },
    };
  }

  const { error: splitErr } = await supabase.from("expensesplits").insert(splitRows as any);

  if (splitErr) {
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
  let mem = await assertMembership(supabase, user.id, divvyId);
  const creator = mem.ok ? false : await isCreatorOfDivvy(supabase, user.id, divvyId);

  // se for creator mas não membro, tenta corrigir automaticamente
  let ensured: any = null;
  if (!mem.ok && creator) {
    ensured = await tryEnsureMembership(supabase, divvyId, "owner");
    mem = await assertMembership(supabase, user.id, divvyId);
  }

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
        meta: { membership: mem, creator, ensured },
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
      ensured,
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

  // precisa ser membro; se for creator, tentamos auto-ensure membership
  let mem = await assertMembership(supabase, user.id, divvyId);
  const creator = mem.ok ? false : await isCreatorOfDivvy(supabase, user.id, divvyId);

  let ensured: any = null;
  if (!mem.ok && creator) {
    ensured = await tryEnsureMembership(supabase, divvyId, "owner");
    mem = await assertMembership(supabase, user.id, divvyId);
  }

  if (!mem.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: "FORBIDDEN",
        message: creator
          ? "Você é creator, mas não consegui garantir membership automaticamente (policy/RLS)."
          : "Forbidden",
        debug: { membership: mem, creator, ensured },
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
