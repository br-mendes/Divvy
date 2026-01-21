'use client';

import { ReactNode } from 'react';
import { CategoriesPanel } from '@/components/groups/CategoriesPanel';

type TabKey =
  | 'members'
  | 'invites'
  | 'requests'
  | 'expenses'
  | 'balances'
  | 'payments'
  | 'periods'
  | 'categories';

type TabItem = { key: TabKey; label: string };

type GroupTabsProps = {
  divvyId: string;
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
  members?: ReactNode;
  invites?: ReactNode;
  requests?: ReactNode;
  expenses?: ReactNode;
  balances?: ReactNode;
  payments?: ReactNode;
  periods?: ReactNode;
};

export function GroupTabs({
  divvyId,
  tab,
  onTabChange,
  members,
  invites,
  requests,
  expenses,
  balances,
  payments,
  periods,
}: GroupTabsProps) {
  const base: TabItem[] = [
    { key: 'expenses', label: 'Despesas' },
    { key: 'balances', label: 'Saldos' },
    { key: 'payments', label: 'Pagamentos' },
    { key: 'periods', label: 'Períodos' },
    { key: 'members', label: 'Membros' },
    { key: 'invites', label: 'Convites' },
    { key: 'requests', label: 'Pedidos' },
  ];

  base.push({ key: 'categories', label: 'Categorias' });

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-2">
        {base.map((item) => (
          <button
            key={item.key}
            className={`rounded border px-3 py-1 text-sm ${
              tab === item.key
                ? 'border-slate-900 text-slate-900'
                : 'border-slate-300 text-slate-500'
            }`}
            onClick={() => onTabChange(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div>
        {tab === 'members' && members}
        {tab === 'invites' && invites}
        {tab === 'requests' && requests}
        {tab === 'expenses' && expenses}
        {tab === 'balances' && balances}
        {tab === 'payments' && payments}
        {tab === 'periods' && periods}
        {tab === 'categories' && <CategoriesPanel divvyId={divvyId} />}
      </div>
    </div>
  );
}
