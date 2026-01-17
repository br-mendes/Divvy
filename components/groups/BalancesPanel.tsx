'use client';

import { useEffect, useMemo, useState } from 'react';

type Balance = {
  userid: string;
  email: string;
  paid_cents: number;
  owed_cents: number;
  net_cents: number;
};

type Transfer = {
  fromUserId: string;
  toUserId: string;
  fromEmail: string;
  toEmail: string;
  amount_cents: number;
};

export function BalancesPanel({ divvyId }: { divvyId: string }) {
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('BRL');
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/groups/${divvyId}/balances`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Erro ao carregar saldos');
      setLoading(false);
      return;
    }

    setCurrency(data.currency ?? 'BRL');
    setBalances(data.balances ?? []);
    setTransfers(data.transfers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [divvyId]);

  const totals = useMemo(() => {
    const totalPaid = balances.reduce((a, b) => a + (b.paid_cents ?? 0), 0);
    const totalOwed = balances.reduce((a, b) => a + (b.owed_cents ?? 0), 0);
    return { totalPaid, totalOwed };
  }, [balances]);

  if (loading) return <div>Carregando...</div>;

  if (error) {
    return (
      <div className="border rounded p-4">
        <div className="font-semibold">Saldos</div>
        <div className="opacity-70 text-sm mt-1">{error}</div>
        <button className="border rounded px-3 py-1 mt-3" onClick={load}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded p-4 space-y-1">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Saldos</div>
          <button className="border rounded px-3 py-1" onClick={load}>
            Recarregar
          </button>
        </div>
        <div className="text-sm opacity-70">
          Total pago: <b>{fmt(currency, totals.totalPaid)}</b> • Total devido:{' '}
          <b>{fmt(currency, totals.totalOwed)}</b>
        </div>
      </div>

      <div className="border rounded p-4 space-y-2">
        <div className="font-semibold">Por pessoa</div>
        <div className="space-y-2">
          {balances
            .slice()
            .sort((a, b) => a.net_cents - b.net_cents)
            .map((b) => (
              <div
                key={b.userid}
                className="border rounded p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{b.email}</div>
                  <div className="text-xs opacity-70">
                    pagou {fmt(currency, b.paid_cents)} • deve {fmt(currency, b.owed_cents)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-70">saldo</div>
                  <div className="font-semibold">
                    {b.net_cents >= 0 ? '+' : '-'}
                    {fmt(currency, Math.abs(b.net_cents))}
                  </div>
                </div>
              </div>
            ))}
          {balances.length === 0 && <div className="opacity-70">Sem dados ainda.</div>}
        </div>
      </div>

      <div className="border rounded p-4 space-y-2">
        <div className="font-semibold">Sugestão de acertos</div>
        {transfers.length === 0 ? (
          <div className="opacity-70">Nada a acertar (ou faltam splits).</div>
        ) : (
          <div className="space-y-2">
            {transfers.map((t, idx) => (
              <div
                key={idx}
                className="border rounded p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="truncate">
                    <b>{t.fromEmail}</b> paga <b>{t.toEmail}</b>
                  </div>
                </div>
                <div className="font-semibold">{fmt(currency, t.amount_cents)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs opacity-70">
        Observação: “Sugestão de acertos” é uma simplificação ótima para quitar dívidas com poucas
        transferências.
      </p>
    </div>
  );
}

function fmt(currency: string, cents: number) {
  const v = (cents / 100).toFixed(2).replace('.', ',');
  if (currency === 'BRL') return `R$ ${v}`;
  return `${currency} ${v}`;
}
