'use client';

import * as React from 'react';
import Link from 'next/link';

type Divvy = {
  id: string;
  name: string;
  type?: string | null;
  creatorid?: string | null;
  created_at?: string | null;
};

export default function DashboardDivviesPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState<Divvy[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/groups', { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || json?.payload?.message || 'Falha ao carregar grupos');
      }

      setGroups((json?.groups ?? []) as Divvy[]);
    } catch (e: any) {
      setError(e?.message ?? 'Erro inesperado');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seus Divvies</h1>
        <div className="flex gap-3">
          <button className="underline text-sm" onClick={load} disabled={loading}>
            Atualizar
          </button>
          <Link className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white" href="/dashboard/create-divvy">
            Novo Divvy
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600">Carregando…</div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700">
          Nenhum Divvy encontrado ainda. Crie o primeiro
          <div className="mt-3">
            <Link className="underline" href="/dashboard/create-divvy">Criar um Divvy</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
            >
              <div className="text-lg font-semibold">{g.name}</div>
              <div className="mt-1 text-xs text-gray-500">
                {g.type ? `type: ${g.type}` : 'type: -'}
              </div>
              <div className="mt-2 text-xs text-gray-400 break-all">{g.id}</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
