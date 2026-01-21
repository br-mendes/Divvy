'use client';

import * as React from 'react';

type Props = { divvyId: string };

const TABS = [
  { key: 'expenses', label: 'Despesas' },
  { key: 'categories', label: 'Categorias' },
  { key: 'balances', label: 'Saldos' },
  { key: 'payments', label: 'Pagamentos' },
  { key: 'members', label: 'Membros' },
  { key: 'invites', label: 'Convites' },
  { key: 'requests', label: 'Solicitações' },
  { key: 'periods', label: 'Períodos' },
];

export function GroupTabs({ divvyId }: Props) {
  const [tab, setTab] = React.useState(() => {
    if (typeof window === 'undefined') return 'expenses';
    const sp = new URLSearchParams(window.location.search);
    return sp.get('tab') || 'expenses';
  });

  React.useEffect(() => {
    const onPop = () => {
      const sp = new URLSearchParams(window.location.search);
      setTab(sp.get('tab') || 'expenses');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  function go(next: string) {
    const sp = new URLSearchParams(window.location.search);
    sp.set('tab', next);

    // Sem template string para evitar corrupção no copy/paste
    const url = window.location.pathname + '?' + sp.toString();
    window.history.replaceState({}, '', url);

    window.dispatchEvent(new Event('popstate'));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => go(t.key)}
            className={
              'rounded px-3 py-1 text-sm ' +
              (tab === t.key
                ? 'bg-black text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-600">
          Grupo: <span className="font-mono">{divvyId}</span>
        </div>
        <div className="mt-2 text-lg font-semibold text-gray-900">Aba atual: {tab}</div>
        <p className="mt-2 text-sm text-gray-600">
          Stub estável para destravar build. Vamos reativar a UI real depois.
        </p>
      </div>
    </div>
  );
}

export default GroupTabs;