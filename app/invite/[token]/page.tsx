'use client';

import { useEffect, useState } from 'react';

type Invite = {
  valid?: boolean;
  invitedemail?: string;
  role?: string;
  status?: string;
  expired?: boolean;
  divvy?: {
    name?: string;
  };
};

export default function InvitePage({ params }: { params: { token: string } }) {
  const token = params.token;

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/invites/${token}`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Convite não encontrado');
      setInvite(null);
      setLoading(false);
      return;
    }

    setInvite(data.invite);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [token]);

  async function accept() {
    setAccepting(true);
    const res = await fetch(`/api/invites/${token}/accept`, { method: 'POST' });
    const data = await res.json();

    if (res.status === 401) {
      window.location.href = `/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`;
      return;
    }

    if (!res.ok) {
      alert(data.error ?? 'Erro ao aceitar convite');
      setAccepting(false);
      return;
    }

    window.location.href = `/groups/${data.divvyId}`;
  }

  if (loading) {
    return <div className="max-w-xl mx-auto p-6">Carregando convite...</div>;
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 space-y-3">
        <h1 className="text-2xl font-bold">Convite</h1>
        <div className="border rounded p-4">{error}</div>
      </div>
    );
  }

  const valid = invite?.valid;
  const groupName = invite?.divvy?.name ?? 'Grupo';

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Convite para o Divvy</h1>

      <div className="border rounded p-4 space-y-2">
        <div>
          <span className="opacity-70">Grupo:</span> <b>{groupName}</b>
        </div>
        <div>
          <span className="opacity-70">Convidado:</span>{' '}
          <b>{invite?.invitedemail}</b>
        </div>
        <div>
          <span className="opacity-70">Função:</span> <b>{invite?.role}</b>
        </div>
        <div className="text-xs opacity-70">
          Status: <b>{invite?.status}</b>
          {invite?.expired ? ' • expirado' : ''}
        </div>
      </div>

      {!valid ? (
        <div className="border rounded p-4">
          Este convite não está mais disponível (expirado, aceito ou revogado).
        </div>
      ) : (
        <button
          className="border rounded px-4 py-2"
          onClick={accept}
          disabled={accepting}
        >
          {accepting ? 'Aceitando...' : 'Aceitar convite'}
        </button>
      )}

      <p className="text-sm opacity-70">
        Se você não estiver logado, vamos pedir para entrar e voltar
        automaticamente.
      </p>
    </div>
  );
}
