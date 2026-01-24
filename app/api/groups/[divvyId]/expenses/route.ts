import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

// ---------- helpers ----------
function json(ok: boolean, body: any, status = 200) {
  return NextResponse.json(body, { status });
}

function pickFirst<T>(...vals: Array<T | null | undefined>) {
  for (const v of vals) if (v !== null && v !== undefined) return v;
  return undefined;
}

function toNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeCategory(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  const allowed = new Set([
    "food",
    "transport",
    "accommodation",
    "activity",
    "utilities",
    "shopping",
    "other",
  ]);
  return allowed.has(s) ? s : "other";
}

function normalizeDate(v: any) {
  // Espera "YYYY-MM-DD". Se vier vazio, usa hoje.
  const s = String(v ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type MembersShape =
  | { table: "divvy_members"; divvyCol: "divvy_id"; userCol: "user_id" }
  | { table: "divvymembers"; divvyCol: "divvyid"; userCol: "userid" }
  | null;

async function detectMembersShape(supabase: any): Promise<MembersShape> {
  // Tenta divvy_members (seu patch)
  {
    const { error } = await supabase
      .from("divvy_members")
      .select("user_id,divvy_id")
      .limit(1);
    if (!error) return { table: "divvy_members", divvyCol: "divvy_id", userCol: "user_id" };
  }

  // Fallback: schema original (divvymembers)
  {
    const { error } = await supabase
      .from("divvymembers")
      .select("userid,divvyid")
      .limit(1);
    if (!error) return { table: "divvymembers", divvyCol: "divvyid", userCol: "userid" };
  }

  return null;
}

async function requireUser(supabase: any) {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

async function fetchPaidByProfiles(supabase: any, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, any>();

  const { data, error } = await supabase
    .from("userprofiles")
    .select("id, fullname, displayname, email, avatarurl")
    .in("id", userIds);

  if (error || !data) return new Map<string, any>();

  const map = new Map<string, any>();
  for (const p of data) {
    const fullName = pickFirst(p.displayname, p.fullname, p.email, "Usuário") as string;
    map.set(p.id, {
      id: p.id,
      full_name: fullName,
      avatar_url: p.avatarurl ?? null,
      email: p.email ?? null,
    });
  }
  return map;
}

// ---------- GET (list) ----------
export async function GET(_req: Request, ctx: { params: { divvyId: string } }) {
  const divvyId = String(ctx?.params?.divvyId ?? "").trim();
  if (!divvyId) {
    return json(false, { ok: false, code: "BAD_REQUEST", message: "Missing divvyId" }, 400);
  }

  const supabase = createRouteHandlerClient({ cookies });
  const user = await requireUser(supabase);
  if (!user) {
    return json(false, { ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" }, 401);
  }

  // colunas reais: divvyid, paidbyuserid, createdat... (sem created_at/title/divvy_id)
  const { data: rows, error } = await supabase
    .from("expenses")
    .select(
      "id, divvyid, paidbyuserid, amount, currency, category, description, date, receiptphotourl, locked, lockedreason, lockedat, createdat, updatedat"
    )
    .eq("divvyid", divvyId)
    .order("date", { ascending: false })
    .order("createdat", { ascending: false })
    .limit(200);

  if (error) {
    return json(
      false,
      {
        ok: false,
        code: "DB_ERROR",
        message: error.message,
        where: "expenses_list",
        meta: { expensesTable: "expenses" },
      },
      500
    );
  }

  const paidByIds = Array.from(
    new Set((rows ?? []).map((r: any) => r?.paidbyuserid).filter(Boolean))
  ) as string[];

  const paidByMap = await fetchPaidByProfiles(supabase, paidByIds);

  // Retorno compatível com a UI (aliases)
  const expenses = (rows ?? []).map((e: any) => ({
    id: e.id,
    divvy_id: e.divvyid, // alias só pra debug/compat
    paid_by_user_id: e.paidbyuserid,
    amount: e.amount,
    currency: e.currency ?? "BRL",
    category: e.category ?? "other",
    description: e.description ?? "",
    date: e.date,
    receipt_photo_url: e.receiptphotourl ?? null,
    locked: !!e.locked,
    locked_reason: e.lockedreason ?? null,
    locked_at: e.lockedat ?? null,

    // aliases esperados em trechos da UI
    created_at: e.createdat ?? null,
    updated_at: e.updatedat ?? null,

    // objeto esperado: exp.paid_by?.full_name
    paid_by: paidByMap.get(e.paidbyuserid) ?? null,
  }));

  return json(true, {
    ok: true,
    divvyId,
    expenses,
    authMode: "cookie",
    debug: {
      userId: user.id,
      hasAuthHeader: false,
      cookieMode: "auth-helpers",
      count: expenses.length,
    },
  });
}

// ---------- POST (create) ----------
export async function POST(req: Request, ctx: { params: { divvyId: string } }) {
  const divvyId = String(ctx?.params?.divvyId ?? "").trim();
  if (!divvyId) {
    return json(false, { ok: false, code: "BAD_REQUEST", message: "Missing divvyId" }, 400);
  }

  const supabase = createRouteHandlerClient({ cookies });
  const user = await requireUser(supabase);
  if (!user) {
    return json(false, { ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" }, 401);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const description = String(body?.description ?? "").trim();
  const amount = toNumber(body?.amount);
  const category = normalizeCategory(body?.category);
  const currency = String(body?.currency ?? "BRL").trim().toUpperCase() || "BRL";
  const date = normalizeDate(body?.date);

  if (!description) {
    return json(false, { ok: false, code: "BAD_REQUEST", message: "description is required" }, 400);
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return json(false, { ok: false, code: "BAD_REQUEST", message: "amount must be > 0" }, 400);
  }

  const paidByUserId = String(body?.paid_by_user_id ?? body?.paidByUserId ?? user.id);

  const insertPayload = {
    divvyid: divvyId,
    paidbyuserid: paidByUserId,
    amount,
    currency,
    category,
    description,
    date,
    receiptphotourl: body?.receipt_photo_url ?? body?.receiptPhotoUrl ?? null,
  };

  const { data: created, error: createErr } = await supabase
    .from("expenses")
    .insert(insertPayload)
    .select(
      "id, divvyid, paidbyuserid, amount, currency, category, description, date, receiptphotourl, locked, lockedreason, lockedat, createdat, updatedat"
    )
    .single();

  if (createErr || !created?.id) {
    return json(
      false,
      { ok: false, code: "DB_ERROR", message: createErr?.message ?? "Failed to create expense" },
      500
    );
  }

  // splits: se vier body.splits, usa; senão divide igual entre membros
  let splitsInserted = 0;
  try {
    const splits = Array.isArray(body?.splits) ? body.splits : null;

    if (splits && splits.length > 0) {
      const rows = splits
        .map((s: any) => ({
          expenseid: created.id,
          participantuserid: String(s.userId ?? s.participantuserid ?? "").trim(),
          amountowed: toNumber(s.amountOwed ?? s.amountowed),
        }))
        .filter((r: any) => r.participantuserid && Number.isFinite(r.amountowed) && r.amountowed >= 0);

      if (rows.length > 0) {
        const { error: splitErr } = await supabase.from("expensesplits").insert(rows);
        if (!splitErr) splitsInserted = rows.length;
      }
    } else {
      const shape = await detectMembersShape(supabase);

      let memberIds: string[] = [user.id];
      if (shape) {
        const { data: members, error: memErr } = await supabase
          .from(shape.table)
          .select(`${shape.userCol}`)
          .eq(shape.divvyCol, shape.table === "divvy_members" ? divvyId : divvyId);

        if (!memErr && members?.length) {
          memberIds = Array.from(new Set(members.map((m: any) => m?.[shape.userCol]).filter(Boolean)));
        }
      }

      // divide igualmente
      const perHead = Math.max(0, Number((amount / memberIds.length).toFixed(2)));
      const rows = memberIds.map((uid) => ({
        expenseid: created.id,
        participantuserid: uid,
        amountowed: perHead,
      }));

      const { error: splitErr } = await supabase.from("expensesplits").insert(rows);
      if (!splitErr) splitsInserted = rows.length;
    }
  } catch {
    // não falha a criação da despesa por causa de split
  }

  const paidByMap = await fetchPaidByProfiles(supabase, [created.paidbyuserid]);

  return json(true, {
    ok: true,
    divvyId,
    expense: {
      id: created.id,
      divvy_id: created.divvyid,
      paid_by_user_id: created.paidbyuserid,
      amount: created.amount,
      currency: created.currency ?? "BRL",
      category: created.category ?? "other",
      description: created.description ?? "",
      date: created.date,
      receipt_photo_url: created.receiptphotourl ?? null,
      locked: !!created.locked,
      locked_reason: created.lockedreason ?? null,
      locked_at: created.lockedat ?? null,
      created_at: created.createdat ?? null,
      updated_at: created.updatedat ?? null,
      paid_by: paidByMap.get(created.paidbyuserid) ?? null,
    },
    splitsInserted,
    authMode: "cookie",
  });
}
