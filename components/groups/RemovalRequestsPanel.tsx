'use client';

import { useEffect, useState } from 'react';

type RemovalRequest = {
  id: string;
  requestedby: string;
  targetuserid: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdat: string;

  // retornados pelo endpoint melhorado
  requestedbyemail?: string | null;
  targetuseremail?: string | null;
};

export function RemovalRequestsPanel({ divvyId }: { divvyId: string }) {
  const [requests, setRequests] = useState<RemovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  async function load() {
    setLoading(true);
    setForbidden(false);

    const res = await fetch(`/api/groups/${divvyId}/removal-requests`);
    const data = await res.json();

    if (res.status === 403) {
      setForbidden(true);
      setRequests([]);
      setLoading(false);
      return;
    }

    if (res.ok) setRequests(data.requests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [divvyId]);

  async function decide(requestId: string, decision: 'approved' | 'rejected') {
    const note = window.prompt('Nota (opcional):') ?? '';
    const res = await fetch(`/api/groups/${divvyId}/removal-requests/${requestId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, note }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error ?? 'Erro ao decidir');
    await load();
  }

  if (forbidden) {
    // Usuários comuns não precisam ver esse painel
    return null;
  }

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pedidos de remoção</h2>
        <button className="border rounded px-3 py-1" onClick={load}>
          Recarregar
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <div key={r.id} className="border rounded p-3 space-y-2">
              <div className="text-sm space-y-1">
                <div>
                  <span className="opacity-70">Remover:</span>{' '}
                  <b>{r.targetuseremail ?? r.targetuserid}</b>
                </div>
                <div>
                  <span className="opacity-70">Solicitado por:</span>{' '}
                  <b>{r.requestedbyemail ?? r.requestedby}</b>
                </div>
                {r.reason && (
                  <div>
                    <span className="opacity-70">Motivo:</span> <b>{r.reason}</b>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button className="border rounded px-3 py-1" onClick={() => decide(r.id, 'approved')}>
                  Aprovar
                </button>
                <button className="border rounded px-3 py-1" onClick={() => decide(r.id, 'rejected')}>
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
          {requests.length === 0 && <p className="opacity-70">Nenhum pedido pendente.</p>}
        </div>
      )}
    </div>
  );
}
