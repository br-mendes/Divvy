import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

type AnyRow = Record<string, any>;

function asNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// tenta rodar um select mínimo pra ver se a tabela existe e é acessível
async function tableExists(supabase: any, table: string) {
  const { error } = await supabase.from(table).select("id").limit(1);
  return !error;
}

async function pickFirstExistingTable(supabase: any, candidates: string[]) {
  for (const t of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await tableExists(supabase, t);
    if (ok) return t;
  }
  return null;
}

function pickField(row: AnyRow, candidates: string[]) {
  for (const k of candidates) {
    if (row && Object.prototype.hasOwnProperty.call(row, k)) return k;
  }
  return null;
}

function normalizeMoney(value: number, mode: "cents" | "units") {
  if (!Number.isFinite(value)) return 0;
  return mode === "cents" ? value / 100 : value;
}

export async function GET(
  _req: Request,
  { params }: { params: { divvyId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return NextResponse.json(
      { ok: false, code: "UNAUTHENTICATED", message: "You must be logged in" },
      { status: 401 }
    );
  }

  const userId = authData.user.id;
  const divvyId = params.divvyId;

  // 1) membership check (evita RLS confusa em outras tabelas)
  const membershipTable = "divvy_members";
  const { data: myMembership, error: memErr } = await supabase
    .from(membershipTable)
    .select("divvy_id,user_id,role")
    .eq("divvy_id", divvyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memErr) {
    return NextResponse.json(
      {
        ok: false,
        code: "DB_ERROR",
        message: memErr.message,
        where: "membership_check",
      },
      { status: 500 }
    );
  }

  if (!myMembership) {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", message: "Not a member of this group" },
      { status: 403 }
    );
  }

  // 2) listar membros (pra fallback de split igual)
  const { data: members, error: membersErr } = await supabase
    .from(membershipTable)
    .select("user_id,role,created_at")
    .eq("divvy_id", divvyId);

  if (membersErr) {
    return NextResponse.json(
      {
        ok: false,
        code: "DB_ERROR",
        message: membersErr.message,
        where: "members_list",
      },
      { status: 500 }
    );
  }

  const memberIds = (members ?? [])
    .map((m: any) => m?.user_id)
    .filter(Boolean) as string[];

  // 3) descobrir tabela de despesas / splits (tolerante)
  const expensesTable = await pickFirstExistingTable(supabase, [
    "expenses",
    "divvy_expenses",
    "group_expenses",
  ]);

  // se ainda não tem despesas implementadas, devolve saldo “zerado” com base nos membros
  if (!expensesTable) {
    const balances = memberIds.map((id) => ({
      userId: id,
      paid: 0,
      owed: 0,
      balance: 0,
    }));

    return NextResponse.json({
      ok: true,
      divvyId,
      balances,
      note: "No expenses table found yet (checked: expenses/divvy_expenses/group_expenses).",
      authMode: "cookie",
      debug: {
        userId,
        membershipTable,
        expensesTable: null,
        splitsTable: null,
        members: memberIds.length,
      },
    });
  }

  const splitsTable = await pickFirstExistingTable(supabase, [
    "expense_splits",
    "splits",
    "divvy_splits",
  ]);

  // 4) buscar despesas do grupo
  const { data: expenses, error: expErr } = await supabase
    .from(expensesTable)
    .select("*")
    .eq("divvy_id", divvyId);

  if (expErr) {
    return NextResponse.json(
      {
        ok: false,
        code: "DB_ERROR",
        message: expErr.message,
        where: "expenses_list",
        meta: { expensesTable },
      },
      { status: 500 }
    );
  }

  const expRows = (expenses ?? []) as AnyRow[];

  if (expRows.length === 0) {
    const balances = memberIds.map((id) => ({
      userId: id,
      paid: 0,
      owed: 0,
      balance: 0,
    }));

    return NextResponse.json({
      ok: true,
      divvyId,
      balances,
      note: "No expenses for this group yet.",
      authMode: "cookie",
      debug: {
        userId,
        membershipTable,
        expensesTable,
        splitsTable,
        members: memberIds.length,
        expenses: 0,
      },
    });
  }

  // 5) inferir colunas (super tolerante)
  const sample = expRows[0] ?? {};

  const expenseIdCol = pickField(sample, ["id", "expense_id"]);
  const amountCol = pickField(sample, [
    "amount",
    "total",
    "value",
    "amount_cents",
    "total_cents",
    "value_cents",
  ]);
  const paidByCol = pickField(sample, [
    "paid_by",
    "payer_id",
    "paidby",
    "created_by",
    "creatorid",
    "user_id",
  ]);

  const amountMode: "cents" | "units" =
    amountCol && amountCol.toLowerCase().includes("cents") ? "cents" : "units";

  if (!expenseIdCol || !amountCol || !paidByCol) {
    return NextResponse.json(
      {
        ok: false,
        code: "SCHEMA_NOT_SUPPORTED",
        message:
          "Could not infer expense schema (need id + amount + paid_by fields).",
        meta: {
          expensesTable,
          inferred: { expenseIdCol, amountCol, paidByCol, amountMode },
          sampleKeys: Object.keys(sample),
        },
      },
      { status: 500 }
    );
  }

  // 6) inicializar acumuladores
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};

  for (const id of memberIds) {
    paid[id] = 0;
    owed[id] = 0;
  }

  // 7) carregar splits se existir
  let splitsByExpense: Record<string, AnyRow[]> = {};
  if (splitsTable) {
    const expenseIds = expRows.map((e) => String(e[expenseIdCol])).filter(Boolean);
    // tenta select amplo — se RLS impedir, a gente cai no fallback igualitário
    const { data: splits, error: splitsErr } = await supabase
      .from(splitsTable)
      .select("*")
      .in("expense_id", expenseIds);

    if (!splitsErr && Array.isArray(splits)) {
      for (const s of splits as AnyRow[]) {
        const eid = String(s.expense_id ?? "");
        if (!eid) continue;
        if (!splitsByExpense[eid]) splitsByExpense[eid] = [];
        splitsByExpense[eid].push(s);
      }
    } else {
      // se falhar, ignora splitsTable e faz fallback
      splitsByExpense = {};
    }
  }

  // 8) calcular saldos
  for (const exp of expRows) {
    const eid = String(exp[expenseIdCol] ?? "");
    const payer = String(exp[paidByCol] ?? "");
    const rawAmount = asNumber(exp[amountCol]);
    const amount = normalizeMoney(rawAmount, amountMode);

    if (!eid || !payer || !Number.isFinite(amount) || amount <= 0) continue;

    if (!(payer in paid)) paid[payer] = 0;
    paid[payer] += amount;

    const splits = splitsByExpense[eid];

    if (splits && splits.length > 0) {
      // inferir colunas de splits
      const s0 = splits[0] ?? {};
      const splitUserCol = pickField(s0, ["user_id", "member_id", "userid"]);
      const splitAmountCol = pickField(s0, [
        "amount",
        "value",
        "share",
        "amount_cents",
        "value_cents",
        "share_cents",
      ]);
      const splitMode: "cents" | "units" =
        splitAmountCol && splitAmountCol.toLowerCase().includes("cents")
          ? "cents"
          : "units";

      if (splitUserCol && splitAmountCol) {
        for (const s of splits) {
          const uid = String(s[splitUserCol] ?? "");
          if (!uid) continue;

          const sAmount = normalizeMoney(asNumber(s[splitAmountCol]), splitMode);
          if (!Number.isFinite(sAmount) || sAmount <= 0) continue;

          if (!(uid in owed)) owed[uid] = 0;
          owed[uid] += sAmount;
        }
        continue;
      }
      // se não conseguir inferir splits, cai no split igualitário
    }

    // fallback: dividir igual entre membros do grupo
    const participants = memberIds.length > 0 ? memberIds : payer ? [payer] : [];
    const each = participants.length > 0 ? amount / participants.length : 0;

    for (const uid of participants) {
      if (!(uid in owed)) owed[uid] = 0;
      owed[uid] += each;
    }
  }

  const balances = Object.keys({ ...paid, ...owed }).map((uid) => {
    const p = paid[uid] ?? 0;
    const o = owed[uid] ?? 0;
    return {
      userId: uid,
      paid: Number(p.toFixed(2)),
      owed: Number(o.toFixed(2)),
      balance: Number((p - o).toFixed(2)), // positivo => “tem a receber”
    };
  });

  // ordena por maior “a receber”
  balances.sort((a, b) => b.balance - a.balance);

  return NextResponse.json({
    ok: true,
    divvyId,
    balances,
    note:
      splitsTable && Object.keys(splitsByExpense).length > 0
        ? "Computed using splits"
        : "Computed with fallback equal split (no usable splits found)",
    authMode: "cookie",
    debug: {
      userId,
      membershipTable,
      expensesTable,
      splitsTable,
      inferred: { expenseIdCol, amountCol, paidByCol, amountMode },
      members: memberIds.length,
      expenses: expRows.length,
      usedSplitsFor: Object.keys(splitsByExpense).length,
    },
  });
}
