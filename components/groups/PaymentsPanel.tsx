'use client';

import { useEffect, useMemo, useState } from 'react';

type Member = { userid: string; email: string; role: string };

type Payment = {
  id: string;
  createdby: string;
  from_userid: string;
  to_userid: string;
  amount_cents: number;
  currency: string;
  paid_at: string;
  note: string | null;
  createdat: string;
};

export function PaymentsPanel({ divvyId }: { divvyId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [note, setNote] = useState('');

  const emailById = useMemo(() => {
    const m = new Map<string, string>();
    members.forEach((x) => m.set(x.userid, x.email));
    return m;
  }, [members]);

  async function load() {
    setLoading(true);

    const [groupRes, payRes] = await Promise.all([
      fetch(`/api/groups/${divvyId}`),
      fetch(`/api/groups/${divvyId}/payments`),
    ]);

    const groupData = await groupRes.json();
    const payData = await payRes.json();

    if (groupRes.ok) {
      const ms = groupData.members ?? [];
      setMembers(ms);

      // defaults
      if (!fromUserId && ms.length) setFromUserId(ms[0].userid);
      if (!toUserId && ms.length > 1) setToUserId(ms[1].userid);
    }

    if (payRes.ok) setPayments(payData.payments ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [divvyId]);

  async function createPayment(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = Math.round(Number(amount.replace(',', '.')) * 100);

    const res = await fetch(`/api/groups/${divvyId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUserId,
        toUserId,
        amountCents,
        paidAt: paidAt || undefined,
        note: note || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error ?? 'Erro ao registrar pagamento');

    setAmount('');
    setPaidAt('');
    setNote('');
    await load();
    alert('Pagamento registrado.');
  }

  async function removePayment(paymentId: string) {
    const ok = window.confirm('Excluir este pagamento?');
    if (!ok) return;

    const res = await fetch(`/api/groups/${divvyId}/payments/${paymentId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return alert(data.error ?? 'Erro ao excluir');

    await load();
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <form onSubmit={createPayment} className="border rounded p-4 space-y-2">
        <div className="font-semibold">Registrar pagamento</div>

        <div className="grid gap-2 md:grid-cols-2">
          <select
            className="border rounded px-3 py-2"
            value={fromUserId}
            onChange={(e) => setFromUserId(e.target.value)}
          >
            <option value="" disabled>
              Quem pagou?
            </option>
            {members.map((m) => (
              <option key={m.userid} value={m.userid}>
                {m.email}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-3 py-2"
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
          >
            <option value="" disabled>
              Para quem?
            </option>
            {members.map((m) => (
              <option key={m.userid} value={m.userid}>
                {m.email}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Valor (ex: 50,00)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <input
            className="border rounded px-3 py-2"
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />

          <input
            className="border rounded px-3 py-2"
            placeholder="Nota (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button className="border rounded px-4 py-2">Salvar pagamento</button>
      </form>

      <div className="border rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Pagamentos</div>
          <button className="border rounded px-3 py-1" onClick={load}>
            Recarregar
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="opacity-70">Nenhum pagamento registrado.</div>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="border rounded p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate">
                    <b>{emailById.get(p.from_userid) ?? p.from_userid}</b> pagou{' '}
                    <b>{emailById.get(p.to_userid) ?? p.to_userid}</b>
                  </div>
                  <div className="text-xs opacity-70">
                    {p.paid_at} {p.note ? `• ${p.note}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="font-semibold">{fmt(p.currency, p.amount_cents)}</div>
                  <button className="border rounded px-3 py-1" onClick={() => removePayment(p.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs opacity-70">
        Dica: depois de registrar pagamentos, volte em “Saldos” para ver o saldo ajustado.
      </p>
    </div>
  );
}

function fmt(currency: string, cents: number) {
  const v = (cents / 100).toFixed(2).replace('.', ',');
  if (currency === 'BRL') return `R$ ${v}`;
  return `${currency} ${v}`;
}
