'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
};

export default function ExpensesPage() {
  const [filter, setFilter] = useState('');

  const expenses = useMemo<ExpenseItem[]>(
    () => [
      { id: '1', description: 'Hospedagem', amount: 500, category: 'accommodation', date: '2026-01-14' },
      { id: '2', description: 'Jantar', amount: 150, category: 'food', date: '2026-01-13' },
    ],
    []
  );

  const visible = useMemo(
    () => expenses.filter(e => (filter ? e.category === filter : true)),
    [expenses, filter]
  );

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Despesas</h1>
        <Link
          href="/dashboard/expenses/create"
          className="inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90"
        >
          + Nova despesa
        </Link>
      </header>

      <section className="bg-white border border-gray-200 rounded-lg p-4 flex gap-3 items-center">
        <span className="text-sm text-gray-600">Filtrar categoria:</span>
        <select
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="food">Comida</option>
          <option value="transport">Transporte</option>
          <option value="accommodation">Hospedagem</option>
          <option value="entertainment">Entretenimento</option>
          <option value="other">Outro</option>
        </select>
      </section>

      <section className="space-y-3">
        {visible.length === 0 ? (
          <div className="text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-6">
            Nenhuma despesa para este filtro.
          </div>
        ) : (
          visible.map((e) => (
            <div key={e.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between">
              <div>
                <div className="font-semibold text-gray-900">{e.description}</div>
                <div className="text-sm text-gray-500">
                  {e.category} • {e.date}
                </div>
              </div>
              <div className="font-bold">R$ {e.amount.toFixed(2)}</div>
            </div>
          ))
        )}
      </section>

      <p className="text-xs text-gray-500">
        Stub criado automaticamente para corrigir o build (o arquivo anterior tinha conteúdo duplicado e export repetido).
      </p>
    </main>
  );
}
