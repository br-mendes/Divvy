'use client';

import { useEffect, useState } from 'react';

type BalancesPanelProps = {
  divvyId: string;
};

type BalancesResponse = {
  balances: Record<string, number>;
  payments: Array<{
    from_userid: string;
    to_userid: string;
    amount_cents: number;
    paid_at: string;
  }>;
};

export function BalancesPanel({ divvyId }: BalancesPanelProps) {
  const [data, setData] = useState<BalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!divvyId) return;

    async function load() {
      const sp = new URLSearchParams(window.location.search);
      const from = sp.get('from') || '';
      const to = sp.get('to') || '';
      const q = new URLSearchParams();
      if (from) q.set('from', from);
      if (to) q.set('to', to);

      const res = await fetch(`/api/groups/${divvyId}/balances?${q.toString()}`);
      const payload = await res.json();
      setData(payload as BalancesResponse);
      setLoading(false);
    }

    load();
  }, [divvyId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div className="text-sm text-gray-500">
        {Object.keys(data?.balances ?? {}).length} membros
      </div>
    </div>
  );
}
