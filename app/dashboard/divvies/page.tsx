'use client';

import * as React from 'react';
import Link from 'next/link';
import { fetchGroups, type DivvyGroup } from '@/lib/api/groups';

function formatDate(iso?: string | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR');
  } catch {
    return iso;
  }
}

export default function DashboardDivviesPage() {
  const [loading, setLoading] = React.useState(true);
  const [groups, setGroups] = React.useState<DivvyGroup[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [debug, setDebug] = React.useState<any>(null);
  const showDebug = process.env.NODE_ENV === 'development';

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);

      const data = await fetchGroups();

      if (!alive) return;

      if (!data?.ok) {
        setGroups([]);
        setError(data?.note || 'Falha ao carregar grupos');
        setDebug(data?.debug ?? data);
      } else {
        setGroups(Array.isArray(data.groups) ? data.groups : []);
        setDebug(data);
      }

      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Seus grupos</h1>
          <p className="text-sm text-gray-600">Carregado via /api/groups</p>
        </div>

        <Link
          href="/dashboard/create-divvy"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          + Novo grupo
        </Link>
      </header>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          Carregando…
        </div>
      ) : error ? (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="font-semibold">Não foi possível carregar seus grupos</div>
          <div>{error}</div>

          {showDebug && (
            <details className="text-xs text-red-900/80">
              <summary className="cursor-pointer">Debug</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ) : groups.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-lg font-semibold">Nenhum grupo ainda</div>
          <p className="text-sm text-gray-600">
            Crie seu primeiro grupo para começar a dividir despesas.
          </p>
          <Link
            href="/dashboard/create-divvy"
            className="inline-flex rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Criar grupo
          </Link>

          {showDebug && (
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer">Debug</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {groups
            .slice()
            .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
            .reverse()
            .map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{g.name || 'Sem nome'}</div>
                    <div className="text-xs text-gray-600">
                      Tipo: {g.type || '-'} • Criado em: {formatDate(g.created_at)}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-gray-500">
                    {g.id.slice(0, 8)}…
                  </span>
                </div>
              </Link>
            ))}
        </div>
      )}
    </main>
  );
}
