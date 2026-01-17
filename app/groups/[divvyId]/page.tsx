'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { InvitesPanel } from '@/components/groups/InvitesPanel';

export default function GroupDetailPage({
  params,
}: {
  params: { divvyId: string };
}) {
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
        <InvitesPanel divvyId={divvyId} />
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
        {divvy?.description && (
          <p className="opacity-70 mt-1">{divvy.description}</p>
        )}
        <p className="text-sm opacity-70 mt-2">
          Tipo: <b>{divvy?.type ?? 'other'}</b>
        </p>
      </div>

      <div className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Membros</h2>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="border rounded p-3 flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{member.email}</div>
                <div className="text-xs opacity-70">
                  role: <b>{member.role}</b>
                </div>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="opacity-70">Nenhum membro encontrado.</p>
          )}
        </div>
      </div>

      <InvitesPanel divvyId={divvyId} />
    </div>
  );
}
