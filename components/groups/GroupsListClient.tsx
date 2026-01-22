'use client';

import * as React from 'react';
import Link from 'next/link';
import Button from '@/components/common/Button';

type ApiOk<T> = { ok: true } & T;
type ApiErr = { ok: false; code?: string; message?: string; extra?: any };

async function apiFetch<T>(url: string, init?: RequestInit): Promise<ApiOk<T>> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });

  const data = (await res.json().catch(() => null)) as (ApiOk<T> | ApiErr | null);
  if (!res.ok || !data || (data as any).ok === false) {
    const err = data as ApiErr | null;
    throw new Error(err?.message || `Request failed (${res.status})`);
  }
  return data as ApiOk<T>;
}

function pickGroups(payload: any): any[] {
  // tenta cobrir formatos diferentes
  if (!payload) return [];
  if (Array.isArray(payload.groups)) return payload.groups;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.divvies)) return payload.divvies;
  return [];
}

export default function GroupsListClient() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<any>('/api/groups');
      const list = pickGroups(res);
      setGroups(list);
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao carregar grupos.');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Meus grupos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Lista carregada via <span className="font-mono">GET /api/groups</span>
          </p>
        </div>

        <div className="shrink-0 flex gap-2">
          <Button variant="secondary" onClick={() => void load()} disabled={loading}>
            Atualizar
          </Button>
          <Link
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            href="/dashboard/create-divvy"
          >
            Criar grupo
          </Link>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">
          Carregando…
        </div>
      ) : (
        <section className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-800">Grupos ({groups.length})</h2>
          </div>

          {groups.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              Nenhum grupo retornado pela API. Se você acabou de criar, clique em “Atualizar”.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {groups.map((g) => {
                const id = g?.id ?? g?.divvy_id ?? g?.divvyId ?? g?.group_id;
                const name = g?.name ?? g?.title ?? 'Grupo';
                const desc = g?.description ?? g?.desc ?? '';
                return (
                  <li key={String(id)} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{name}</div>
                      <div className="text-xs text-gray-500 mt-1 font-mono break-all">
                        {String(id)}
                      </div>
                      {desc ? <div className="text-sm text-gray-600 mt-2">{desc}</div> : null}
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Link
                        className="inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-900"
                        href={`/groups/${id}`}
                      >
                        Abrir
                      </Link>
                      <div className="text-[11px] text-gray-500">
                        URL: <span className="font-mono">/groups/{String(id)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
