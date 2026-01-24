import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

type MembershipShape =
  | { table: "divvy_members"; groupIdCol: "divvy_id"; userIdCol: "user_id" }
  | { table: "divvymembers"; groupIdCol: "divvyid"; userIdCol: "userid" };

async function getAuthedUser(supabase: any) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return { user: null, error: error?.message ?? "UNAUTHENTICATED" };
  return { user: data.user, error: null };
}

async function findMembershipShape(supabase: any): Promise<MembershipShape | null> {
  // Tenta divvy_members
  {
    const { error } = await supabase.from("divvy_members").select("divvy_id").limit(1);
    if (!error) return { table: "divvy_members", groupIdCol: "divvy_id", userIdCol: "user_id" };
  }
  // Tenta divvymembers (schema antigo do seu doc)
  {
    const { error } = await supabase.from("divvymembers").select("divvyid").limit(1);
    if (!error) return { table: "divvymembers", groupIdCol: "divvyid", userIdCol: "userid" };
  }
  return null;
}

async function isMemberOrCreator(supabase: any, divvyId: string, userId: string) {
  const shape = await findMembershipShape(supabase);

  // 1) membership table
  if (shape) {
    const { data, error } = await supabase
      .from(shape.table)
      .select("*")
      .eq(shape.groupIdCol, divvyId)
      .eq(shape.userIdCol, userId)
      .limit(1);

    if (!error && (data?.length ?? 0) > 0) {
      return { ok: true, via: "membership" as const, membershipShape: shape, membershipError: null };
    }

    // se deu erro (RLS/policy), continua no fallback
    if (error) {
      // cai pro creator fallback abaixo
      const creator = await isCreator(supabase, divvyId, userId);
      if (creator.ok) return { ok: true, via: "creator" as const, membershipShape: shape, membershipError: error.message };
      return { ok: false, via: "none" as const, membershipShape: shape, membershipError: error.message };
    }
  }

  // 2) creator fallback
  const creator = await isCreator(supabase, divvyId, userId);
  if (creator.ok) return { ok: true, via: "creator" as const, membershipShape: shape, membershipError: null };

  return { ok: false, via: "none" as const, membershipShape: shape, membershipError: null };
}

async function isCreator(supabase: any, divvyId: string, userId: string) {
  const { data, error } = await supabase
    .from("divvies")
    .select("id")
    .eq("id", divvyId)
    .eq("creatorid", userId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return { ok: !!data?.id, error: null };
}

function parseNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

function normalizeISODateOnly(input: any): string | null {
  // aceita "2026-01-24", Date, ISO, etc — devolve YYYY-MM-DD
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  // se já é YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function listMemberIds(supabase: any, divvyId: string, shape: MembershipShape | null) {
  if (shape) {
    const { data, error } = await supabase
      .from(shape.table)
      .select(shape.userIdCol)
      .eq(shape.groupIdCol, divvyId);

    if (!error) {
      const ids = (data ?? [])
        .map((r: any) => r?.[shape.userIdCol])
        .filter(Boolean) as string[];
      return { ids, error: null };
    }
    return { ids: [] as string[], error: error.message };
  }
  // fallback: pelo menos o creator
  return { ids: [] as string[], error: "NO_MEMBERSHIP_TABLE" };
}

function buildEqualSplits(userIds: string[], total: number) {
  const n = userIds.length;
  if (n <= 0) return [];

  // arredonda para 2 casas, distribuindo resto
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  let remainder = cents - base * n;

  return userIds.map((uid) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { userid: uid, amount: (base + extra) / 100 };
  });
}

export async function GET(_: Request, ctx: { params: { divvyId: string } }) {
  const divvyId = ctx.params.divvyId;
  const supabase = createRouteHandlerClient({ cookies });

  const { user, error } = await getAuthedUser(supabase);
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" }, { status: 401 });
  }

  const gate = await isMemberOrCreator(supabase, divvyId, user.id);
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", message: "You are not a member of this group", meta: { membershipError: gate.membershipError } },
      { status: 403 }
    );
  }

  // schema real: expenses.divvyid + createdat (não created_at)
  const { data, error: dbErr } = await supabase
    .from("expenses")
    .select("id,divvyid,title,description,amount,currency,date,paidbyuserid,categoryid,splitmode,locked,deleted,createdat,updatedat")
    .eq("divvyid", divvyId)
    .eq("deleted", false)
    .order("date", { ascending: false, nullsFirst: false })
    .order("createdat", { ascending: false, nullsFirst: false });

  if (dbErr) {
    return NextResponse.json(
      { ok: false, code: "DB_ERROR", message: dbErr.message, where: "expenses_list", meta: { membershipError: gate.membershipError } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    divvyId,
    expenses: data ?? [],
    note: "expenses-list",
    authMode: "cookie",
    meta: {
      membershipError: gate.membershipError,
      via: gate.via,
      membershipTable: gate.membershipShape?.table ?? null,
      count: (data ?? []).length,
    },
  });
}

export async function POST(req: Request, ctx: { params: { divvyId: string } }) {
  const divvyId = ctx.params.divvyId;
  const supabase = createRouteHandlerClient({ cookies });

  const { user } = await getAuthedUser(supabase);
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" }, { status: 401 });
  }

  const gate = await isMemberOrCreator(supabase, divvyId, user.id);
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", message: "You are not a member of this group", meta: { membershipError: gate.membershipError } },
      { status: 403 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const title = String(body?.title ?? body?.name ?? "Nova despesa").trim();
  const amount = parseNumber(body?.amount);
  const currency = String(body?.currency ?? "BRL").trim() || "BRL";
  const date = normalizeISODateOnly(body?.date);
  const description = body?.description != null ? String(body.description).trim() : null;
  const categoryid = body?.categoryid ?? body?.categoryId ?? null;

  if (!title) {
    return NextResponse.json({ ok: false, code: "VALIDATION", message: "title is required" }, { status: 400 });
  }
  if (amount === null || amount <= 0) {
    return NextResponse.json({ ok: false, code: "VALIDATION", message: "amount must be > 0" }, { status: 400 });
  }

  // Insert expense (schema real)
  const expensePayload: any = {
    divvyid: divvyId,
    title,
    amount,
    currency,
    paidbyuserid: user.id,
    splitmode: "equal",
  };
  if (description) expensePayload.description = description;
  if (date) expensePayload.date = date;
  if (categoryid) expensePayload.categoryid = categoryid;

  const { data: created, error: createErr } = await supabase
    .from("expenses")
    .insert(expensePayload)
    .select("id,divvyid,title,amount,currency,date,paidbyuserid,splitmode,createdat")
    .single();

  if (createErr || !created?.id) {
    return NextResponse.json(
      { ok: false, code: "CREATE_EXPENSE_FAILED", message: createErr?.message ?? "Unknown error", meta: { membershipError: gate.membershipError } },
      { status: 500 }
    );
  }

  // Build splits:
  // - se body.splits existir (array [{ userId, amount }]), usa isso
  // - senão cria equal splits para todos membros (se conseguir listar), senão cria split só pro payer
  let splits: Array<{ userid: string; amount: number }> = [];

  const incoming = Array.isArray(body?.splits) ? body.splits : null;
  if (incoming && incoming.length > 0) {
    splits = incoming
      .map((s: any) => ({ userid: String(s.userId ?? s.userid ?? "").trim(), amount: parseNumber(s.amount) }))
      .filter((s: any) => s.userid && typeof s.amount === "number" && s.amount > 0) as any;

    // se soma não bater, não quebra: apenas segue (UI pode mandar valores exatos)
  } else {
    const members = await listMemberIds(supabase, divvyId, gate.membershipShape ?? null);
    const ids = members.ids.length > 0 ? members.ids : [user.id];
    splits = buildEqualSplits(ids, amount);
  }

  // grava splits em expensesplits (schema real: expenseid, userid, amount, paid)
  const splitRows = splits.map((s) => ({
    expenseid: created.id,
    userid: s.userid,
    amount: s.amount,
    paid: s.userid === user.id, // opcional: payer como "paid" (você pode ajustar depois)
  }));

  const { error: splitErr } = await supabase.from("expensesplits").insert(splitRows);

  if (splitErr) {
    return NextResponse.json({
      ok: true,
      expense: created,
      warning: { code: "SPLITS_NOT_CREATED", message: splitErr.message },
      meta: { membershipError: gate.membershipError },
    });
  }

  return NextResponse.json({
    ok: true,
    expense: created,
    splits: splitRows,
    meta: { membershipError: gate.membershipError },
  });
}
