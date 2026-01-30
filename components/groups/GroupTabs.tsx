'use client';

import * as React from 'react';

export type GroupTabKey =
  | 'expenses'
  | 'categories'
  | 'balances'
  | 'payments'
  | 'members'
  | 'invites'
  | 'requests'
  | 'periods';

type TabDef = { key: GroupTabKey; label: string };

const TABS: TabDef[] = [
  { key: 'expenses', label: 'Despesas' },
  { key: 'categories', label: 'Categorias' },
  { key: 'balances', label: 'Saldos' },
  { key: 'payments', label: 'Pagamentos' },
  { key: 'members', label: 'Membros' },
  { key: 'invites', label: 'Convites' },
  { key: 'requests', label: 'Solicitações' },
  { key: 'periods', label: 'Períodos' },
];

type Props = {
  value: GroupTabKey;
  onChange: (key: GroupTabKey) => void;
  className?: string;
};

export function GroupTabs({ value, onChange, className }: Props) {
  return (
    <div className={className ?? ''}>
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((t) => {
          const active = value === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={[
                'rounded px-3 py-1 text-sm transition',
                active
                  ? 'bg-black text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GroupTabs;