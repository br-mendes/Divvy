'use client';

import { useEffect, useMemo, useState } from 'react';
import { Notice } from '@/components/common/Notice';

type ReqRow = {
  id: string;
  divvyid: string;
  type: 'remove_member';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_by: string;
  target_userid: string;
  reason: string | null;
  createdat: string;
};

export function RequestsPanel({ divvyId, members }: { divvyId: string; members: any[] }) {
  const [items, setItems] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const emailById = useMemo(() => {
    const m = new Map<string, string>();
    (members ?? []).forEach((x: any) => m.set(x.userid, x.email));
    return m;
  }, [members]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/groups/${divvyId}/requests`);
    const data = await res.json();
    if (res.ok) setItems(data.requests ?? []);
    else setNotice({ type: 'error', message: String(data.error ?? 'Erro ao carregar') });
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [divvyId]);

  async function decide(id: string, action: 'approve' | 'reject') {
    setBusyId(id);
    setNotice(null);
    const res = await fetch(`/api/groups/${divvyId}/requests/${id}/${action}`, { method: 'POST' });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) return setNotice({ type: 'error', message: String(data.error ?? 'Erro') });
    setNotice({ type: 'success', message: action === 'approve' ? 'Aprovado.' : 'Rejeitado.' });
    await load();
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-3">
      {notice && <Notice type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}

      <div className="border rounded p-4 space-y-2">
        <div className="font-semibold">Solicitações</div>
        <div className="text-sm opacity-70">
          Aqui aparecem pedidos pendentes (ex.: remover membro) para aprovação.
        </div>
        <button className="border rounded px-3 py-1" onClick={load} type="button">
          Recarregar
        </button>
      </div>

      {items.length === 0 ? (
        <div className="opacity-70">Nenhuma solicitação.</div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="border rounded p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {r.type === 'remove_member' ? 'Remover membro' : r.type}
                  {r.status !== 'pending' ? ` • ${r.status}` : ''}
                </div>
                <div className="text-xs opacity-70">
                  por <b>{emailById.get(r.requested_by) ?? r.requested_by}</b> → alvo{' '}
                  <b>{emailById.get(r.target_userid) ?? r.target_userid}</b>
                  {r.reason ? ` • ${r.reason}` : ''}
                </div>
              </div>

              {r.status === 'pending' ? (
                <div className="flex items-center gap-2">
                  <button
                    className="border rounded px-3 py-1"
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => decide(r.id, 'approve')}
                  >
                    {busyId === r.id ? '...' : 'Aprovar'}
                  </button>
                  <button
                    className="border rounded px-3 py-1"
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => decide(r.id, 'reject')}
                  >
                    Rejeitar
                  </button>
                </div>
              ) : (
                <span className="text-xs opacity-70">concluída</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
