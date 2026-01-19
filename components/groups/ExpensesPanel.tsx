'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type ExpenseCategory = {
  id: string;
  name: string;
  isarchived?: boolean;
};

type Expense = {
  id: string;
  title: string | null;
  description: string | null;
  amount_cents: number | null;
  currency: string | null;
  expense_date: string | null;
  payeruserid: string | null;
  category?: {
    name?: string | null;
  } | null;
};

type ExpensesPanelProps = {
  divvyId: string;
};

export default function ExpensesPanel({ divvyId }: ExpensesPanelProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [expenseDate, setExpenseDate] = useState('');
  const [payerUserId, setPayerUserId] = useState('');

  const selectedCategoryName = useMemo(() => {
    if (!categoryId) return '';
    return categories.find((c) => c.id === categoryId)?.name ?? '';
  }, [categoryId, categories]);

  const load = useCallback(async () => {
    if (!divvyId) return;
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        fetch(`/api/groups/${divvyId}/expenses`),
        fetch(`/api/groups/${divvyId}/categories`),
      ]);

      const expData = await expRes.json();
      const catData = await catRes.json();

      if (expRes.ok) {
        setExpenses(expData.expenses ?? []);
      }
      if (catRes.ok) {
        setCategories((catData.categories ?? []).filter((c: ExpenseCategory) => !c.isarchived));
      }
    } finally {
      setLoading(false);
    }
  }, [divvyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      paidByUserId: payerUserId,
      amount: Number(amount),
      category: selectedCategoryName || 'other',
      description: description || title,
      date: expenseDate,
      currency,
      categoryId: categoryId || null,
    };

    const response = await fetch(`/api/groups/${divvyId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setTitle('');
      setDescription('');
      setAmount('');
      setExpenseDate('');
      setCategoryId('');
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Título</label>
          <input
            className="border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Jantar"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descrição</label>
          <input
            className="border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Valor</label>
          <input
            className="border rounded px-3 py-2"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Moeda</label>
          <input
            className="border rounded px-3 py-2"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="BRL"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Data</label>
          <input
            className="border rounded px-3 py-2"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Pagador</label>
          <input
            className="border rounded px-3 py-2"
            value={payerUserId}
            onChange={(e) => setPayerUserId(e.target.value)}
            placeholder="payer user id"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Categoria</label>
          <select
            className="border rounded px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Categoria (opcional)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="border rounded px-4 py-2 bg-blue-600 text-white"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Adicionar'}
        </button>
      </form>

      <div className="space-y-3">
        {expenses.map((expense) => {
          const payerEmail = expense.payeruserid ?? '';
          const amountValue = (Number(expense.amount_cents ?? 0) / 100).toFixed(2);
          return (
            <div key={expense.id} className="border rounded px-4 py-3">
              <div className="font-medium">
                {expense.title || expense.description || 'Despesa'}
              </div>
              <div className="text-sm opacity-80">
                {amountValue} {expense.currency ?? 'BRL'}
              </div>
              <div className="text-xs opacity-70">
                {expense.expense_date} • pagou: <b>{payerEmail}</b>
                {expense.category?.name ? ` • categoria: ${expense.category.name}` : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
