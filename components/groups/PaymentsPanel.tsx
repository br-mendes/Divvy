'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface PaymentsPanelProps {
  load?: () => Promise<void>;
  onSubmit?: (data: { fromUserId: string; toUserId: string; amount: string; note: string }) => void | Promise<void>;
}

export default function PaymentsPanel({ load, onSubmit }: PaymentsPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [prefillBanner, setPrefillBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  function replaceUrl(params: URLSearchParams) {
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const from = searchParams.get('pay_from');
    const to = searchParams.get('pay_to');
    const centsStr = searchParams.get('pay_amount_cents');
    const noteParam = searchParams.get('pay_note');

    if (!from || !to || !centsStr) return;

    const cents = Number(centsStr);
    if (!Number.isFinite(cents) || cents <= 0) return;

    // Preenche (sem depender do load)
    setFromUserId(from);
    setToUserId(to);
    setAmount((cents / 100).toFixed(2).replace('.', ','));

    if (noteParam) setNote(noteParam);

    setPrefillBanner('Formulário preenchido a partir de uma sugestão de acerto.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const createPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit?.({ fromUserId, toUserId, amount, note });
    await load?.();

    // limpa pay_* e volta pra balances
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete('pay_from');
    sp.delete('pay_to');
    sp.delete('pay_amount_cents');
    sp.delete('pay_note');

    // volta para saldos
    sp.set('tab', 'balances');
    sp.set('msg', 'payment_saved');
    replaceUrl(sp);

    // feedback amigável (sem alert)
    setToast('Pagamento registrado! Saldos atualizados.');
  };

  return (
    <div className="space-y-3">
      {toast && (
        <div className="border rounded p-3 text-sm" role="status" aria-live="polite">
          {toast}
          <button
            className="border rounded px-2 py-1 ml-3 text-xs"
            onClick={() => setToast(null)}
            type="button"
          >
            ok
          </button>
        </div>
      )}
      {prefillBanner && (
        <div className="border rounded p-3 text-sm">
          {prefillBanner}
          <button
            className="border rounded px-2 py-1 ml-3 text-xs"
            onClick={() => setPrefillBanner(null)}
            type="button"
          >
            ok
          </button>
        </div>
      )}
      <form className="space-y-3" onSubmit={createPayment}>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">De</span>
          <input
            className="border rounded px-3 py-2"
            value={fromUserId}
            onChange={(event) => setFromUserId(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Para</span>
          <input
            className="border rounded px-3 py-2"
            value={toUserId}
            onChange={(event) => setToUserId(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Valor</span>
          <input
            className="border rounded px-3 py-2"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Observação</span>
          <input
            className="border rounded px-3 py-2"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <button className="border rounded px-3 py-2" type="submit">
          Registrar
        </button>
      </form>
    </div>
  );
}
