'use client';

import Link from 'next/link';
import * as React from 'react';

type Group = {
  id: string;
  name?: string;
  description?: string | null;
  created_at?: string;
  members_count?: number;
};

function normalizeGroups(payload: any): Group[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.groups)) return payload.groups;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.group) return [payload.group];
  return [];
}

export default function GroupsListClient() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [raw, setRaw] = React.useState<any>(null);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/groups', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));

        if (!mounted) return;

        setRaw(json);

        if (!res.ok) {
          setError(json?.message || json?.error || `Falha ao carregar grupos (HTTP ${res.status})`);
          setGroups([]);
          return;
        }

        const g = normalizeGroups(json);
        setGroups(g);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Erro desconhecido ao carregar grupos');
        setGroups([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">Carregando grupos…</div>;
  }

  if (error) {
    return (
      <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="font-semibold text-red-800">Não foi possível carregar seus grupos</div>
        <div className="text-sm text-red-700">{error}</div>
        <details className="text-xs text-red-800">
          <summary className="cursor-pointer">Debug (resposta /api/groups)</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify(raw, null, 2)}</pre>
        </details>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-700">
        <div className="font-semibold">Nenhum grupo encontrado.</div>
        <p className="mt-1 text-sm text-gray-600">
          Se isso estiver inesperado, pode ser que você esteja deslogado ou a API esteja retornando vazio.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((g) => (
        <Link
          key={g.id}
          href={`/groups/${g.id}`}
          className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-gray-900">{g.name || 'Grupo sem nome'}</div>
              <div className="mt-1 line-clamp-2 text-sm text-gray-600">{g.description || 'Sem descrição.'}</div>
            </div>
            <div className="shrink-0 text-right text-xs text-gray-500">
              <div className="font-mono">{g.id.slice(0, 8)}…</div>
              {typeof g.members_count === 'number' ? <div>{g.members_count} membros</div> : null}
            </div>
          </div>

          {g.created_at ? (
            <div className="mt-3 text-xs text-gray-500">
              Criado em {new Date(g.created_at).toLocaleDateString('pt-BR')}
            </div>
          ) : null}
        </Link>
      ))}
    </div>
  );
}