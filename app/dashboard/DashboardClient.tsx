'use client';

import * as React from 'react';
import Link from 'next/link';
import Button from '@/components/common/Button';

type Group = any;

export default function DashboardClient() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState<Group[]>([]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/groups', { cache: 'no-store' });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = payload?.message || payload?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setGroups(payload?.groups ?? []);
    } catch (e: any) {
      setGroups([]);
      setError(e?.message || 'Falha ao carregar grupos');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meus grupos</h1>
          <p className="text-sm text-gray-600">Crie um grupo ou entre em um existente para comecar.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/groups"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Abrir /groups
          </Link>
          <Link href="/dashboard/create-divvy">
            <Button>+ Criar grupo</Button>
          </Link>
        </div>
      </div>

      {loading ? <div className="text-sm text-gray-600">Carregando...</div> : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">Erro</div>
          <div className="mt-1 text-sm">{error}</div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={load}>
              Tentar novamente
            </Button>
            <Link href="/auth/login">
              <Button>Entrar</Button>
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-3">
          {groups.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-700">
              Voce ainda nao participa de nenhum grupo.
            </div>
          ) : (
            groups.map((g: any) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
              >
                <div className="font-semibold">{g.name}</div>
                <div className="text-xs text-gray-500">{g.type || 'trip'}</div>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </main>
  );
}
