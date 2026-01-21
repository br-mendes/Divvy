'use client';

import { useEffect, useState } from 'react';
import { Notice } from '@/components/common/Notice';

type ReqRow = {
  id: string;
  divvyid: string;
  type: string;
  status: string;
  requested_by: string;
  target_userid: string;
  reason: string | null;
  createdat: string;
};

export default function AdminRequestsPage() {
  const [items, setItems] = useState<ReqRow[]>([]);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  );

  async function load() {
    const res = await fetch('/api/admin/requests');
    const data = await res.json();
    if (!res.ok) return setNotice({ type: 'error', message: String(data.error ?? 'Erro') });
    setItems(data.requests ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-4 space-y-3">
      <div className="text-xl font-semibold">Admin • Solicitações pendentes</div>
      {notice && <Notice type={notice.type} message={notice.message} onClose={() => setNotice(null)} />}

      <button className="border rounded px-3 py-1" onClick={load} type="button">
        Recarregar
      </button>

      {items.length === 0 ? (
        <div className="opacity-70">Nada pendente.</div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="border rounded p-3">
              <div className="font-medium">{r.type}</div>
              <div className="text-xs opacity-70">
                group: <b>{r.divvyid}</b> • request: <b>{r.id}</b>
              </div>
              <div className="text-sm">
                requester: {r.requested_by} • alvo: {r.target_userid}
              </div>
              {r.reason && <div className="text-sm opacity-80">motivo: {r.reason}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
