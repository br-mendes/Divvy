'use client';

import { useEffect, useMemo, useState } from 'react';

type Expense = {
  id: string;
  title: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  expense_date: string;
  payeruserid: string;
  createdat: string;
};

type Member = { userid: string; email: string; role: string };

export function ExpensesPanel({ divvyId }: { divvyId: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(''); // reais
  const [payerUserId, setPayerUserId] = useState('');
  const [date, setDate] = useState('');

  const membersById = useMemo(() => {
    const m = new Map<string, string>();
    members.forEach((x) => m.set(x.userid, x.email));
    return m;
  }, [members]);

  async function load() {
    setLoading(true);

    const [groupRes, expRes] = await Promise.all([
      fetch(`/api/groups/${divvyId}`),
      fetch(`/api/groups/${divvyId}/expenses`),
    ]);

    const groupData = await groupRes.json();
    const expData = await expRes.json();

    if (groupRes.ok) {
      setMembers(groupData.members ?? []);
      if (!payerUserId && (groupData.members ?? []).length) {
        setPayerUserId(groupData.members[0].userid);
      }
    }

    if (expRes.ok) setExpenses(expData.expenses ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [divvyId]);

  async function createExpense(e: React.FormEvent) {
    e.preventDefault();

    const amountCents = Math.round(Number(amount.replace(',', '.')) * 100);
    const res = await fetch(`/api/groups/${divvyId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        amountCents,
        payerUserId,
        currency: 'BRL',
        expenseDate: date || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error ?? 'Erro ao criar despesa');

    setTitle('');
    setAmount('');
    setDate('');
    await load();
    alert('Despesa criada. Agora você pode abrir e definir os splits (próximo passo).');
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <form onSubmit={createExpense} className="border rounded p-4 space-y-2">
        <div className="font-semibold">Nova despesa</div>

        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Título (ex: Uber, Mercado...)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid gap-2 md:grid-cols-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Valor (ex: 123,45)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2"
            value={payerUserId}
            onChange={(e) => setPayerUserId(e.target.value)}
          >
            <option value="" disabled>
              Quem pagou?
            </option>
            {members.map((m) => (
              <option key={m.userid} value={m.userid}>
                {m.email}
              </option>
            ))}
          </select>

          <input
            className="border rounded px-3 py-2"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <button className="border rounded px-4 py-2">Criar despesa</button>
      </form>

      <div className="border rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Despesas</div>
          <button className="border rounded px-3 py-1" onClick={load}>
            Recarregar
          </button>
        </div>

        {expenses.length === 0 ? (
          <p className="opacity-70">Nenhuma despesa ainda.</p>
        ) : (
          <div className="space-y-2">
            {expenses.map((x) => (
              <ExpenseRow
                key={x.id}
                divvyId={divvyId}
                expense={x}
                payerEmail={membersById.get(x.payeruserid) ?? x.payeruserid}
                onChanged={load}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatBRL(cents: number) {
  const v = (cents / 100).toFixed(2).replace('.', ',');
  return `R$ ${v}`;
}

function ExpenseRow({
  divvyId,
  expense,
  payerEmail,
  onChanged,
}: {
  divvyId: string;
  expense: Expense;
  payerEmail: string;
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [splits, setSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadDetail() {
    setLoading(true);
    const res = await fetch(`/api/groups/${divvyId}/expenses/${expense.id}`);
    const data = await res.json();
    if (res.ok) setSplits(data.splits ?? []);
    setLoading(false);
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await loadDetail();
  }

  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">{expense.title}</div>
          <div className="text-xs opacity-70">
            {expense.expense_date} • pagou: <b>{payerEmail}</b>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="font-semibold">{formatBRL(expense.amount_cents)}</div>
          <button className="border rounded px-3 py-1" onClick={toggle}>
            {open ? 'Fechar' : 'Detalhes'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          {loading ? (
            <div>Carregando splits...</div>
          ) : (
            <div className="text-sm">
              <div className="opacity-70 mb-1">Splits (valores por usuário):</div>
              {(splits ?? []).length === 0 ? (
                <div className="opacity-70">Nenhum split definido ainda.</div>
              ) : (
                <ul className="list-disc pl-5">
                  {splits.map((s: any) => (
                    <li key={s.id}>
                      {s.userid}: {formatBRL(s.amount_cents)}
                    </li>
                  ))}
                </ul>
              )}
              <div className="text-xs opacity-70 mt-2">
                Próximo passo: UI para definir split igual/manual (vamos fazer na etapa seguinte).
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
