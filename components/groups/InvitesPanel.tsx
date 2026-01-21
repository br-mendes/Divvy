'use client';

import { useEffect, useMemo, useState } from 'react';

type Invite = {
  id: string;
  token: string;
  invitedemail: string;
  role: 'admin' | 'member';
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  createdat: string;
  expiresat: string;
  acceptedat: string | null;
};

export function InvitesPanel({ divvyId }: { divvyId: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [loading, setLoading] = useState(true);

  const pending = useMemo(() => invites.filter((i) => i.status === 'pending'), [invites]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/groups/${divvyId}/invites/list`);
    const data = await res.json();
    if (res.ok) setInvites(data.invites ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [divvyId]);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/groups/${divvyId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error ?? 'Erro ao convidar');

    setEmail('');
    await load();
    alert('Convite criado e enviado (se o Resend estiver configurado).');
  }

  async function revoke(inviteId: string) {
    const res = await fetch(`/api/groups/${divvyId}/invites/${inviteId}/revoke`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return alert(data.error ?? 'Erro ao revogar');
    await load();
  }

  async function resend(inviteId: string) {
    const res = await fetch(`/api/groups/${divvyId}/invites/${inviteId}/resend`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return alert(data.error ?? 'Erro ao reenviar');
    alert('Convite reenviado!');
  }

  return (
    <div className="border rounded p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Convites</h2>
        <button className="border rounded px-3 py-1" onClick={load}>
          Recarregar
        </button>
      </div>

      <form onSubmit={createInvite} className="grid gap-2 md:grid-cols-[1fr,140px,120px]">
        <input
          className="border rounded px-3 py-2"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
        >
          <option value="member">member</option>
          <option value="admin">admin</option>
        </select>
        <button className="border rounded px-3 py-2" type="submit">
          Convidar
        </button>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <div className="text-sm opacity-70">
            Pendentes: <b>{pending.length}</b> • Total: <b>{invites.length}</b>
          </div>

          <div className="space-y-2">
            {invites.map((i) => {
              const link = `${window.location.origin}/invite/${i.token}`;
              return (
                <div
                  key={i.id}
                  className="border rounded p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.invitedemail}</div>
                    <div className="text-xs opacity-70">
                      status: <b>{i.status}</b> • role: <b>{i.role}</b>
                    </div>
                    <div className="text-xs opacity-70 truncate">
                      link:{' '}
                      <a className="underline" href={link}>
                        {link}
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {i.status === 'pending' && (
                      <>
                        <button className="border rounded px-3 py-1" onClick={() => resend(i.id)}>
                          Reenviar
                        </button>
                        <button className="border rounded px-3 py-1" onClick={() => revoke(i.id)}>
                          Revogar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {invites.length === 0 && <p className="opacity-70">Nenhum convite ainda.</p>}
          </div>
        </>
      )}
    </div>
  );
}
