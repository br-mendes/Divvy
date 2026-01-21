'use client';

import { useEffect, useState } from 'react';

type Member = {
  id: string;
  userid: string;
  email: string;
  role: 'admin' | 'member';
  joinedat: string;
};

export function MembersPanel({ divvyId }: { divvyId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/groups/${divvyId}`);
    const data = await res.json();
    if (res.ok) setMembers(data.members ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [divvyId]);

  async function removeMember(userIdToRemove: string, email: string) {
    const ok = window.confirm(`Remover ${email} do grupo? (Pode gerar pedido de aprovação)`);
    if (!ok) return;

    const reason = window.prompt('Motivo (opcional):') ?? '';
    const res = await fetch(`/api/groups/${divvyId}/members/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIdToRemove, reason }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error ?? 'Erro ao remover/solicitar remoção');
      return;
    }

    if (data.action === 'removed') {
      alert('Membro removido.');
      await load();
      return;
    }

    if (data.action === 'requested') {
      alert('Pedido de remoção enviado para aprovação.');
      return;
    }

    alert('Ação concluída.');
  }

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Membros</h2>
        <button className="border rounded px-3 py-1" onClick={load}>
          Recarregar
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="border rounded p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.email}</div>
                <div className="text-xs opacity-70">
                  role: <b>{m.role}</b>
                </div>
              </div>

              <button className="border rounded px-3 py-1" onClick={() => removeMember(m.userid, m.email)}>
                Remover
              </button>
            </div>
          ))}
          {members.length === 0 && <p className="opacity-70">Nenhum membro encontrado.</p>}
        </div>
      )}
    </div>
  );
}
