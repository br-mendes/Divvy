'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Period = {
  id: string;
  period_from: string;
  period_to: string;
  status: 'closed' | 'open';
  closed_at: string;
  snapshot: any;
};

export function PeriodsPanel({ divvyId }: { divvyId: string }) {
  const searchParams = useSearchParams();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/groups/${divvyId}/periods`);
    const data = await res.json();
    if (res.ok) setPeriods(data.periods ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [divvyId]);

  async function closeCurrentRange() {
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    if (!from || !to) {
      alert('Defina um período (De/Até) no topo do grupo antes de fechar.');
      return;
    }

    const ok = window.confirm(
      `Fechar período de ${from} até ${to}? Isso bloqueia edições nesse intervalo.`,
    );
    if (!ok) return;

    const res = await fetch(`/api/groups/${divvyId}/periods/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error ?? 'Erro ao fechar período');

    alert('Período fechado com sucesso.');
    await load();
  }

  async function reopen(periodId: string) {
    const ok = window.confirm('Reabrir este período? Isso libera edições nesse intervalo.');
    if (!ok) return;

    const res = await fetch(`/api/groups/${divvyId}/periods/${periodId}/reopen`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error ?? 'Erro ao reabrir');

    await load();
  }

  return (
    <div className="space-y-4">
      <div className="border rounded p-4 space-y-2">
        <div className="font-semibold">Fechar período</div>
        <p className="text-sm opacity-70">
          Use o seletor de período no topo (De/Até). Depois clique em “Fechar período”.
        </p>
        <button className="border rounded px-4 py-2" onClick={closeCurrentRange}>
          Fechar período atual
        </button>
      </div>

      <div className="border rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Histórico de períodos</div>
          <button className="border rounded px-3 py-1" onClick={load}>
            Recarregar
          </button>
        </div>

        {loading ? (
          <div>Carregando...</div>
        ) : periods.length === 0 ? (
          <div className="opacity-70">Nenhum período fechado ainda.</div>
        ) : (
          <div className="space-y-2">
            {periods.map((p) => (
              <div
                key={p.id}
                className="border rounded p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {p.period_from} → {p.period_to}
                  </div>
                  <div className="text-xs opacity-70">
                    status: <b>{p.status}</b>
                  </div>
                </div>

                {p.status === 'closed' ? (
                  <button className="border rounded px-3 py-1" onClick={() => reopen(p.id)}>
                    Reabrir
                  </button>
                ) : (
                  <span className="text-xs opacity-70">aberto</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
