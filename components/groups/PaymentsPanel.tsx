'use client';

import { useEffect, useState } from 'react';

type Payment = {
  id: string;
  divvyid: string;
  createdby: string;
  from_userid: string;
  to_userid: string;
  amount_cents: number;
  currency: string;
  paid_at: string;
  note?: string | null;
  createdat: string;
};

type PaymentsPanelProps = {
  divvyId: string;
};

export function PaymentsPanel({ divvyId }: PaymentsPanelProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
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

      const res = await fetch(`/api/groups/${divvyId}/payments?${q.toString()}`);
      const data = await res.json();
      setPayments(data.payments ?? []);
      setLoading(false);
    }

    load();
  }, [divvyId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <div className="text-sm text-gray-500">{payments.length} pagamentos</div>
    </div>
  );
}
