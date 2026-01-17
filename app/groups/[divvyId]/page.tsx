'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GroupTabs } from '@/components/groups/GroupTabs';

export default function GroupDetailPage({ params }: { params: { divvyId: string } }) {
  const divvyId = params.divvyId;

  const [loading, setLoading] = useState(true);
  const [divvy, setDivvy] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/groups/${divvyId}`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Erro ao carregar grupo');
      setLoading(false);
      return;
    }

    setDivvy(data.divvy);
    setMembers(data.members ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [divvyId]);

  if (loading) {
    return <div className="max-w-3xl mx-auto p-6">Carregando grupo...</div>;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-3">
        <Link href="/dashboard" className="underline">
          ← Voltar
        </Link>
        <div className="border rounded p-4">
          <div className="font-semibold">Não foi possível carregar o grupo</div>
          <div className="opacity-70 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Link href="/dashboard" className="underline">
        ← Voltar
      </Link>

      <div className="border rounded p-4">
        <h1 className="text-2xl font-bold">{divvy?.name ?? 'Grupo'}</h1>
        {divvy?.description && <p className="opacity-70 mt-1">{divvy.description}</p>}
        <p className="text-sm opacity-70 mt-2">
          Tipo: <b>{divvy?.type ?? 'other'}</b>
        </p>

        <div className="mt-3 flex gap-2">
          <button className="border rounded px-3 py-1" onClick={load}>
            Recarregar dados
          </button>
        </div>
      </div>

      {/* Tabs “produto” */}
      <GroupTabs divvyId={divvyId} membersCount={members.length} />
    </div>
  );
}
