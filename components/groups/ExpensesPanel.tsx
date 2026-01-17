'use client';

import { useEffect, useMemo, useState } from 'react';
import { SplitsEditor } from '@/components/groups/SplitsEditor';

type Member = { userid: string; email: string; role: string };

type Expense = {
  id: string;
  payeruserid: string;
  amount_cents: number;
  description: string;
};

type Split = { id: string; userid: string; amount_cents: number };

export function ExpensesPanel({
  divvyId,
  expenses,
  members,
  load,
}: {
  divvyId: string;
  expenses: Expense[];
  members: Member[];
  load: () => Promise<void>;
}) {
  const membersById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member) => map.set(member.userid, member.email));
    return map;
  }, [members]);

  return (
    <div className="space-y-4">
      {expenses.map((x) => (
        <ExpenseRow
          key={x.id}
          divvyId={divvyId}
          expense={x}
          payerEmail={membersById.get(x.payeruserid) ?? x.payeruserid}
          members={members}
          onChanged={load}
        />
      ))}
    </div>
  );
}

function ExpenseRow({
  divvyId,
  expense,
  payerEmail,
  members,
  onChanged,
}: {
  divvyId: string;
  expense: Expense;
  payerEmail: string;
  members: Member[];
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [splits, setSplits] = useState<Split[] | null>(null);

  const membersById = useMemo(() => {
    const m = new Map<string, string>();
    members.forEach((x) => m.set(x.userid, x.email));
    return m;
  }, [members]);

  async function loadDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${divvyId}/expenses/${expense.id}/splits`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar splits');
      setSplits(data.splits ?? data);
    } finally {
      setLoading(false);
    }
  }

  async function reloadDetail() {
    await loadDetail();
    await onChanged();
  }

  useEffect(() => {
    if (open) {
      void loadDetail();
    }
  }, [open]);

  return (
    <div className="border rounded p-3">
      <button
        type="button"
        className="w-full text-left flex items-center justify-between gap-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div>
          <div className="font-semibold">{expense.description}</div>
          <div className="text-xs opacity-70">Pago por {payerEmail}</div>
        </div>
        <div className="font-semibold">{formatBRL(expense.amount_cents)}</div>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <div>Carregando...</div>
          ) : (
            <>
              <div className="text-sm">
                <div className="opacity-70 mb-1">Splits atuais:</div>
                {(splits ?? []).length === 0 ? (
                  <div className="opacity-70">Nenhum split definido ainda.</div>
                ) : (
                  <ul className="list-disc pl-5">
                    {splits?.map((s) => (
                      <li key={s.id}>
                        {membersById.get(s.userid) ?? s.userid}: {formatBRL(s.amount_cents)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <SplitsEditor
                divvyId={divvyId}
                expenseId={expense.id}
                totalCents={expense.amount_cents}
                members={members}
                initialSplits={splits ?? []}
                onSaved={reloadDetail}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function formatBRL(cents: number) {
  const v = (cents / 100).toFixed(2).replace('.', ',');
  return `R$ ${v}`;
}
