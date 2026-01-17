'use client';

import { useEffect, useState } from 'react';

type Expense = {
  id: string;
  title?: string | null;
  description?: string | null;
  amount_cents: number;
  currency: string;
  expense_date: string;
  payeruserid: string;
  createdby: string;
  createdat: string;
};

type ExpensesPanelProps = {
  divvyId: string;
};

export function ExpensesPanel({ divvyId }: ExpensesPanelProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!divvyId) return;

    async function load() {
      const sp = new URLSearchParams(window.location.search);
      const from = sp.get('from') || '';
      const to = sp.get('to') || '';
      const q = new URLSearchParams();
      if (from) q.set('from', from);
      if (to) q.set('to', to);

      const res = await fetch(`/api/groups/${divvyId}/expenses?${q.toString()}`);
      const data = await res.json();
      setExpenses(data.expenses ?? []);
      setLoading(false);
    }

    load();
  }, [divvyId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div className="text-sm text-gray-500">{expenses.length} despesas</div>
    </div>
  );
}
