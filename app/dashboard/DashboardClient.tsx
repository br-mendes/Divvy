'use client';

import * as React from 'react';
import Link from 'next/link';
import Button from '@/components/common/Button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Group = any;

export default function DashboardClient() {
  const supabase = React.useMemo(() => createClientComponentClient(), []);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [debug, setDebug] = React.useState<any>(null);
  const [groups, setGroups] = React.useState<Group[]>([]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch('/api/groups', {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const ct = res.headers.get('content-type') || '';
      let payload: any = null;

      if (ct.includes('application/json')) {
        payload = await res.json().catch(() => ({}));
      } else {
        const text = await res.text().catch(() => '');
        payload = { nonJson: true, contentType: ct, text: text.slice(0, 2000) };
      }

      setDebug({ status: res.status, ok: res.ok, payload });

      if (!res.ok) {
        const msg = payload?.message || payload?.error || payload?.payload?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setGroups(payload?.groups ?? payload?.payload?.groups ?? []);
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
          <p className="text-sm text-gray-600">Para uma experiência completa, acesse a página de grupos.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/groups" className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
            Abrir /groups
          </Link>
          <Link href="/dashboard/create-divvy">
            <Button>+ Criar grupo</Button>
          </Link>
        </div>
      </div>

      {loading ? <div className="text-sm text-gray-600">Carregando…</div> : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">Não foi possível carregar seus grupos</div>
          <div className="mt-2 text-sm">{error}</div>

          <details className="mt-3 text-sm">
            <summary className="cursor-pointer select-none">Debug (resposta /api/groups)</summary>
            <pre className="mt-2 overflow-auto rounded bg-white p-3 text-xs text-gray-800">
{JSON.stringify(debug, null, 2)}
            </pre>
          </details>

          <div className="mt-3">
            <Button variant="secondary" onClick={() => load()}>Tentar novamente</Button>
          </div>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="text-lg font-semibold text-gray-900">Meus grupos</div>
          {groups.length === 0 ? (
            <div className="mt-2 text-sm text-gray-600">Nenhum grupo encontrado.</div>
          ) : (
            <div className="mt-4 grid gap-2">
              {groups.map((g: any, idx: number) => {
                const id = g?.id ?? g?.divvy_id ?? g?.group_id ?? `row-${idx}`;
                const name = g?.name ?? g?.title ?? 'Grupo';
                return (
                  <div key={id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">{name}</div>
                      <div className="text-xs text-gray-500 font-mono">{id}</div>
                    </div>
                    <Link className="text-sm underline" href={`/groups/${id}`}>Abrir</Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
