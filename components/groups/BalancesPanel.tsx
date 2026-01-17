'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface Transfer {
  fromUserId: string;
  toUserId: string;
  amount_cents: number;
  fromEmail: string;
  toEmail: string;
}

interface BalancesPanelProps {
  transfers: Transfer[];
  currency: string;
  fmt: (currency: string, amountCents: number) => string;
}

export default function BalancesPanel({ transfers, currency, fmt }: BalancesPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [banner, setBanner] = useState<string | null>(null);

  function goToPayment(t: Transfer) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', 'payments');
    sp.set('pay_from', t.fromUserId);
    sp.set('pay_to', t.toUserId);
    sp.set('pay_amount_cents', String(t.amount_cents));
    sp.set('pay_note', 'Acerto sugerido');
    router.replace(`${pathname}?${sp.toString()}`);
  }

  function cleanMsgParam() {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete('msg');
    router.replace(`${pathname}?${sp.toString()}`);
  }

  useEffect(() => {
    const msg = searchParams.get('msg');

    if (msg === 'payment_saved') {
      setBanner('Pagamento registrado com sucesso. Saldos atualizados.');

      // some sozinho depois de 3s
      const t = setTimeout(() => setBanner(null), 3000);

      // limpa o msg do URL para não repetir
      cleanMsgParam();

      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return (
    <div className="space-y-3">
      {banner && (
        <div className="border rounded p-3 text-sm" role="status" aria-live="polite">
          {banner}
          <button
            className="border rounded px-2 py-1 ml-3 text-xs"
            onClick={() => setBanner(null)}
            type="button"
          >
            ok
          </button>
        </div>
      )}
      <h3 className="text-base font-semibold">Sugestão de acertos</h3>
      <div className="space-y-2">
        {transfers.map((t, idx) => (
          <div key={idx} className="border rounded p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate">
                <b>{t.fromEmail}</b> paga <b>{t.toEmail}</b>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="font-semibold">{fmt(currency, t.amount_cents)}</div>
              <button
                className="border rounded px-3 py-1"
                onClick={() => goToPayment(t)}
                title="Abrir Pagamentos com o formulário preenchido"
              >
                Registrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
