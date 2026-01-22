'use client';

import * as React from 'react';
import GroupTabs, { GroupTabKey } from '@/components/groups/GroupTabs';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';

type ApiOk<T> = { ok: true } & T;
type ApiErr = { ok: false; code?: string; message?: string; extra?: any };

async function apiFetch<T>(url: string, init?: RequestInit): Promise<ApiOk<T>> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  const data = (await res.json().catch(() => null)) as ApiOk<T> | ApiErr | null;

  if (!res.ok || !data || (data as ApiErr).ok === false) {
    const err = data as ApiErr | null;
    const msg = err?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as ApiOk<T>;
}

function formatMoneyBRL(value: number) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

type Props = {
  divvyId: string;
};

export default function GroupPageClient({ divvyId }: Props) {
  const [tab, setTab] = React.useState<GroupTabKey>('expenses');

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [group, setGroup] = React.useState<any>(null);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);

  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [creatingCategory, setCreatingCategory] = React.useState(false);

  const [newExpenseDesc, setNewExpenseDesc] = React.useState('');
  const [newExpenseAmount, setNewExpenseAmount] = React.useState('');
  const [newExpenseCategoryId, setNewExpenseCategoryId] = React.useState('');
  const [creatingExpense, setCreatingExpense] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('tab') as GroupTabKey | null;
    if (q) setTab(q);
  }, []);

  const setTabAndUrl = React.useCallback((next: GroupTabKey) => {
    setTab(next);
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', next);
    const nextUrl = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState({}, '', nextUrl);
  }, []);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const g = await apiFetch<{ table: string; group: any }>(`/api/groups/${divvyId}`);
      setGroup(g.group);

      const [c, e] = await Promise.all([
        apiFetch<{ table: string; categories: any[] }>(`/api/groups/${divvyId}/categories`),
        apiFetch<{ table: string; expenses: any[] }>(`/api/groups/${divvyId}/expenses`),
      ]);

      setCategories(c.categories ?? []);
      setExpenses(e.expenses ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao carregar dados do grupo.');
    } finally {
      setLoading(false);
    }
  }, [divvyId]);

  React.useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function onCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    setCreatingCategory(true);
    setError(null);
    try {
      await apiFetch<{ category: any }>(`/api/groups/${divvyId}/categories`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setNewCategoryName('');
      await loadAll();
      setTabAndUrl('categories');
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao criar categoria.');
    } finally {
      setCreatingCategory(false);
    }
  }

  async function onCreateExpense(e: React.FormEvent) {
    e.preventDefault();

    const description = newExpenseDesc.trim();
    const amount = Number((newExpenseAmount ?? '').toString().replace(',', '.'));

    if (!description) return;
    if (!Number.isFinite(amount) || amount <= 0) return;

    setCreatingExpense(true);
    setError(null);
    try {
      await apiFetch<{ expense: any }>(`/api/groups/${divvyId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description,
          amount,
          category_id: newExpenseCategoryId || undefined,
        }),
      });

      setNewExpenseDesc('');
      setNewExpenseAmount('');
      setNewExpenseCategoryId('');
      await loadAll();
      setTabAndUrl('expenses');
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao criar despesa.');
    } finally {
      setCreatingExpense(false);
    }
  }

  const total = React.useMemo(() => {
    return (expenses ?? []).reduce((acc, it) => acc + Number(it?.amount ?? 0), 0);
  }, [expenses]);

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{group?.name ?? 'Grupo'}</h1>
          <p className="text-sm text-gray-600 mt-1 break-all">
            ID: <span className="font-mono">{divvyId}</span>
          </p>
          {group?.description ? (
            <p className="text-sm text-gray-600 mt-2">{group.description}</p>
          ) : null}
        </div>

        <div className="shrink-0">
          <Button variant="secondary" onClick={() => void loadAll()} disabled={loading}>
            Atualizar
          </Button>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <GroupTabs value={tab} onChange={setTabAndUrl} />

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
          Carregando…
        </div>
      ) : (
        <>
          <section className="grid md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Despesas</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{expenses.length}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Categorias</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{categories.length}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Total</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{formatMoneyBRL(total)}</div>
            </div>
          </section>

          {tab === 'expenses' ? (
            <section className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="font-semibold text-gray-900">Adicionar despesa</h2>
                <form className="mt-3 grid gap-3 md:grid-cols-5" onSubmit={onCreateExpense}>
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Descrição (ex: Uber)"
                      value={newExpenseDesc}
                      onChange={(e) => setNewExpenseDesc((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Valor (ex: 25.90)"
                      value={newExpenseAmount}
                      onChange={(e) => setNewExpenseAmount((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={newExpenseCategoryId}
                      onChange={(e) => setNewExpenseCategoryId(e.target.value)}
                    >
                      <option value="">Sem categoria</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name ?? c.title ?? c.slug ?? c.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <Button type="submit" loading={creatingExpense} className="w-full">
                      Adicionar
                    </Button>
                  </div>
                </form>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Últimas despesas</h3>
                </div>
                {expenses.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600">Nenhuma despesa ainda.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {expenses.map((exp) => (
                      <li key={exp.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {exp.description ?? exp.title ?? 'Sem descrição'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {exp.created_at ? new Date(exp.created_at).toLocaleString('pt-BR') : '—'}
                          </div>
                        </div>
                        <div className="shrink-0 font-bold text-gray-900">
                          {formatMoneyBRL(Number(exp.amount ?? 0))}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : null}

          {tab === 'categories' ? (
            <section className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="font-semibold text-gray-900">Criar categoria</h2>
                <form className="mt-3 flex gap-3" onSubmit={onCreateCategory}>
                  <div className="flex-1">
                    <Input
                      placeholder="Nome da categoria"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <Button type="submit" loading={creatingCategory}>
                    Criar
                  </Button>
                </form>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Categorias</h3>
                </div>
                {categories.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600">Nenhuma categoria ainda.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {categories.map((c) => (
                      <li key={c.id} className="p-4 flex items-center justify-between">
                        <div className="font-medium text-gray-900">
                          {c.name ?? c.title ?? c.slug ?? c.id}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{c.id}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : null}

          {tab !== 'expenses' && tab !== 'categories' ? (
            <section className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
              Aba <span className="font-mono">{tab}</span> ainda não restaurada no B2.
              <div className="mt-2 text-sm text-gray-500">
                (Vamos reativar por etapas sem quebrar o deploy.)
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
