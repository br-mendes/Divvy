'use client';

import Link from 'next/link';
import * as React from 'react';

type AnyObj = Record<string, any>;

function pick(obj: AnyObj | null | undefined, ...keys: string[]) {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function getTabFromLocation() {
  if (typeof window === 'undefined') return 'expenses';
  const sp = new URLSearchParams(window.location.search);
  return sp.get('tab') || 'expenses';
}

function setTabInLocation(next: string) {
  const sp = new URLSearchParams(window.location.search);
  sp.set('tab', next);
  window.history.replaceState({}, '', `${window.location.pathname}?${sp.toString()}`);
}

const TABS = [
  { key: 'expenses', label: 'Despesas' },
  { key: 'categories', label: 'Categorias' },
  { key: 'balances', label: 'Saldos' },
  { key: 'members', label: 'Membros' },
  { key: 'debug', label: 'Debug' },
] as const;

export default function GroupPageClient({ divvyId }: { divvyId: string }) {
  const [tab, setTab] = React.useState<string>(() => getTabFromLocation());

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [groupRaw, setGroupRaw] = React.useState<any>(null);
  const [expensesRaw, setExpensesRaw] = React.useState<any>(null);
  const [categoriesRaw, setCategoriesRaw] = React.useState<any>(null);
  const [balancesRaw, setBalancesRaw] = React.useState<any>(null);

  React.useEffect(() => {
    const onPop = () => setTab(getTabFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function loadAll() {
      setLoading(true);
      setError(null);

      try {
        const [gRes, eRes, cRes, bRes] = await Promise.all([
          fetch(`/api/groups/${divvyId}`, { cache: 'no-store' }),
          fetch(`/api/groups/${divvyId}/expenses`, { cache: 'no-store' }),
          fetch(`/api/groups/${divvyId}/categories`, { cache: 'no-store' }),
          fetch(`/api/groups/${divvyId}/balances`, { cache: 'no-store' }),
        ]);

        const [gJson, eJson, cJson, bJson] = await Promise.all([
          gRes.json().catch(() => ({})),
          eRes.json().catch(() => ({})),
          cRes.json().catch(() => ({})),
          bRes.json().catch(() => ({})),
        ]);

        if (!mounted) return;

        setGroupRaw({ status: gRes.status, ok: gRes.ok, body: gJson });
        setExpensesRaw({ status: eRes.status, ok: eRes.ok, body: eJson });
        setCategoriesRaw({ status: cRes.status, ok: cRes.ok, body: cJson });
        setBalancesRaw({ status: bRes.status, ok: bRes.ok, body: bJson });

        if (!gRes.ok) {
          setError(gJson?.message || gJson?.error || `Falha ao carregar grupo (HTTP ${gRes.status})`);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Erro desconhecido ao carregar dados do grupo');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, [divvyId]);

  const group = (groupRaw?.body?.group || groupRaw?.body?.data || groupRaw?.body) as AnyObj | null;
  const groupName = (pick(group, 'name', 'title') as string) || 'Grupo';
  const groupDesc = (pick(group, 'description', 'details') as string) || '';
  const createdAt = pick(group, 'created_at') as string | undefined;

  function go(next: string) {
    setTabInLocation(next);
    setTab(next);
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Link className="text-sm underline text-gray-700" href="/groups">
              ← Voltar
            </Link>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600">{divvyId}</span>
          </div>

          <h1 className="mt-2 truncate text-2xl font-bold text-gray-900">{groupName}</h1>

          {groupDesc ? <p className="mt-1 text-sm text-gray-600">{groupDesc}</p> : null}

          {createdAt ? (
            <p className="mt-2 text-xs text-gray-500">
              Criado em {new Date(createdAt).toLocaleDateString('pt-BR')}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Link
            href={`/api/groups/${divvyId}/expenses/export.csv`}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Exportar CSV
          </Link>
          <Link
            href="/dashboard/expenses/create"
            className="inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-sm text-white hover:opacity-90"
          >
            + Nova despesa
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">Carregando dados do grupo…</div>
      ) : error ? (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="font-semibold text-red-800">Erro</div>
          <div className="text-sm text-red-700">{error}</div>
          <details className="text-xs text-red-800">
            <summary className="cursor-pointer">Debug</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify(groupRaw, null, 2)}</pre>
          </details>
        </div>
      ) : null}

      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => go(t.key)}
            className={[
              'rounded px-3 py-1 text-sm transition',
              tab === t.key ? 'bg-black text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'expenses' ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Despesas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Esta tela está no modo “compatível” e depende do payload atual da API.
          </p>

          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-gray-700">Ver resposta /api/groups/{divvyId}/expenses</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-800">
{JSON.stringify(expensesRaw, null, 2)}
            </pre>
          </details>
        </section>
      ) : null}

      {tab === 'categories' ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Categorias</h2>
          <p className="mt-1 text-sm text-gray-600">Vamos reativar CRUD completo na próxima etapa.</p>

          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-gray-700">Ver resposta /api/groups/{divvyId}/categories</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-800">
{JSON.stringify(categoriesRaw, null, 2)}
            </pre>
          </details>
        </section>
      ) : null}

      {tab === 'balances' ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Saldos</h2>
          <p className="mt-1 text-sm text-gray-600">Vamos ligar a UI real depois que a base estiver estável.</p>

          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-gray-700">Ver resposta /api/groups/{divvyId}/balances</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-800">
{JSON.stringify(balancesRaw, null, 2)}
            </pre>
          </details>
        </section>
      ) : null}

      {tab === 'members' ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Membros</h2>
          <p className="mt-1 text-sm text-gray-600">
            A listagem final pode vir do endpoint do grupo ou de um endpoint dedicado — por enquanto mantemos debug.
          </p>

          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-gray-700">Ver resposta /api/groups/{divvyId}</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-800">
{JSON.stringify(groupRaw, null, 2)}
            </pre>
          </details>
        </section>
      ) : null}

      {tab === 'debug' ? (
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Debug completo</h2>

          <details className="text-sm">
            <summary className="cursor-pointer text-gray-700">Grupo</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-800">{JSON.stringify(groupRaw, null, 2)}</pre>
          </details>

          <details className="text-sm">
            <summary className="cursor-pointer text-gray-700">Despesas</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-800">{JSON.stringify(expensesRaw, null, 2)}</pre>
          </details>

          <details className="text-sm">
            <summary className="cursor-pointer text-gray-700">Categorias</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-800">{JSON.stringify(categoriesRaw, null, 2)}</pre>
          </details>

          <details className="text-sm">
            <summary className="cursor-pointer text-gray-700">Saldos</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-800">{JSON.stringify(balancesRaw, null, 2)}</pre>
          </details>
        </section>
      ) : null}
    </main>
  );
}
