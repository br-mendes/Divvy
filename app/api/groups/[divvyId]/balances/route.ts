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

function normalizeMoney(value: number, mode: "cents" | "units") {
  if (!Number.isFinite(value)) return 0;
  return mode === "cents" ? value / 100 : value;
}

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

/**
 * Descobre qual coluna na tabela expenses referencia o grupo (divvy).
 * Estratégia:
 * - tenta fazer um select eq(col, divvyId) limit 1
 * - se não der erro (ou der erro de RLS/permission mas NÃO de coluna inexistente), assume que a coluna existe
 * - se der "column ... does not exist", tenta a próxima
 */
async function detectGroupIdColumn(
  supabase: any,
  expensesTable: string,
  divvyId: string
) {
  const candidates = [
    "divvy_id",
    "divvyid",
    "divvyId",
    "group_id",
    "groupid",
    "groupId",
    "divvy",
    "group",
  ];

  for (const col of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const { error } = await supabase
      .from(expensesTable)
      .select("id")
      .eq(col, divvyId)
      .limit(1);

    if (!error) return col;

    const msg = String(error.message || "");
    // se o problema é "coluna não existe", tenta próxima
    if (msg.toLowerCase().includes("does not exist") && msg.includes(col)) {
      continue;
    }

    // qualquer outro erro (RLS, permission, etc) => coluna provavelmente existe
    return col;
  }

  return null;
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

  // 1) membership check
  const membershipTable = "divvy_members";
  const { data: myMembership, error: memErr } = await supabase
    .from(membershipTable)
    .select("divvy_id,user_id,role")
    .eq("divvy_id", divvyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memErr) {
    return NextResponse.json(
      { ok: false, code: "DB_ERROR", message: memErr.message, where: "membership_check" },
      { status: 500 }
    );
  }
  if (!myMembership) {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", message: "Not a member of this group" },
      { status: 403 }
    );
  }

  // 2) listar membros
  const { data: members, error: membersErr } = await supabase
    .from(membershipTable)
    .select("user_id,role,created_at")
    .eq("divvy_id", divvyId);

  if (membersErr) {
    return NextResponse.json(
      { ok: false, code: "DB_ERROR", message: membersErr.message, where: "members_list" },
      { status: 500 }
    );
  }

  const memberIds = (members ?? []).map((m: any) => m?.user_id).filter(Boolean) as string[];

  // 3) descobrir tabela de despesas / splits
  const expensesTable = await pickFirstExistingTable(supabase, [
    "expenses",
    "divvy_expenses",
    "group_expenses",
  ]);

  if (!expensesTable) {
    const balances = memberIds.map((id) => ({ userId: id, paid: 0, owed: 0, balance: 0 }));
    return NextResponse.json({
      ok: true,
      divvyId,
      balances,
      note: "No expenses table found yet (checked: expenses/divvy_expenses/group_expenses).",
      authMode: "cookie",
      debug: { userId, membershipTable, expensesTable: null, splitsTable: null, members: memberIds.length },
    });
  }

  const splitsTable = await pickFirstExistingTable(supabase, [
    "expense_splits",
    "splits",
    "divvy_splits",
  ]);

  // 4) detectar coluna do groupId na tabela de despesas
  const groupIdCol = await detectGroupIdColumn(supabase, expensesTable, divvyId);
  if (!groupIdCol) {
    return NextResponse.json(
      {
        ok: false,
        code: "SCHEMA_NOT_SUPPORTED",
        message: `Could not detect group id column in ${expensesTable}.`,
        meta: { expensesTable },
      },
      { status: 500 }
    );
  }

  // 5) buscar despesas do grupo (com coluna detectada)
  const { data: expenses, error: expErr } = await supabase
    .from(expensesTable)
    .select("*")
    .eq(groupIdCol, divvyId);

  if (expErr) {
    return NextResponse.json(
      {
        ok: false,
        code: "DB_ERROR",
        message: expErr.message,
        where: "expenses_list",
        meta: { expensesTable, groupIdCol },
      },
      { status: 500 }
    );
  }

  const expRows = (expenses ?? []) as AnyRow[];

  if (expRows.length === 0) {
    const balances = memberIds.map((id) => ({ userId: id, paid: 0, owed: 0, balance: 0 }));
    return NextResponse.json({
      ok: true,
      divvyId,
      balances,
      note: "No expenses for this group yet.",
      authMode: "cookie",
      debug: { userId, membershipTable, expensesTable, splitsTable, groupIdCol, members: memberIds.length, expenses: 0 },
    });
  }

  // 6) inferir colunas essenciais em expenses
  const sample = expRows[0] ?? {};
  const expenseIdCol = pickField(sample, ["id", "expense_id"]);
  const amountCol = pickField(sample, ["amount", "total", "value", "amount_cents", "total_cents", "value_cents"]);
  const paidByCol = pickField(sample, ["paid_by", "payer_id", "paidby", "created_by", "creatorid", "user_id"]);

  const amountMode: "cents" | "units" =
    amountCol && amountCol.toLowerCase().includes("cents") ? "cents" : "units";

  if (!expenseIdCol || !amountCol || !paidByCol) {
    return NextResponse.json(
      {
        ok: false,
        code: "SCHEMA_NOT_SUPPORTED",
        message: "Could not infer expense schema (need id + amount + paid_by fields).",
        meta: {
          expensesTable,
          groupIdCol,
          inferred: { expenseIdCol, amountCol, paidByCol, amountMode },
          sampleKeys: Object.keys(sample),
        },
      },
      { status: 500 }
    );
  }

  // 7) acumuladores
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  for (const id of memberIds) {
    paid[id] = 0;
    owed[id] = 0;
  }

  // 8) buscar splits se existir (best-effort)
  let splitsByExpense: Record<string, AnyRow[]> = {};
  if (splitsTable) {
    const expenseIds = expRows.map((e) => String(e[expenseIdCol])).filter(Boolean);

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
      splitsByExpense = {};
    }
  }

  // 9) calcular
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
      const s0 = splits[0] ?? {};
      const splitUserCol = pickField(s0, ["user_id", "member_id", "userid"]);
      const splitAmountCol = pickField(s0, ["amount", "value", "share", "amount_cents", "value_cents", "share_cents"]);
      const splitMode: "cents" | "units" =
        splitAmountCol && splitAmountCol.toLowerCase().includes("cents") ? "cents" : "units";

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
      // se não inferir, cai no fallback igualitário
    }

    const participants = memberIds.length > 0 ? memberIds : [payer];
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
      balance: Number((p - o).toFixed(2)),
    };
  });

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
      groupIdCol,
      inferred: { expenseIdCol, amountCol, paidByCol, amountMode },
      members: memberIds.length,
      expenses: expRows.length,
      usedSplitsFor: Object.keys(splitsByExpense).length,
    },
  });
}
