'use client';

import type { ReactNode } from 'react';
import { BalancesPanel } from '@/components/groups/BalancesPanel';
import { PaymentsPanel } from '@/components/groups/PaymentsPanel';

type TabKey = 'members' | 'invites' | 'requests' | 'expenses' | 'balances' | 'payments';

type Tab = {
  key: TabKey;
  label: string;
};

type GroupTabsProps = {
  divvyId: string;
  tab: TabKey;
  onChange: (tab: TabKey) => void;
  membersPanel?: ReactNode;
  invitesPanel?: ReactNode;
  requestsPanel?: ReactNode;
  expensesPanel?: ReactNode;
};

export function GroupTabs({
  divvyId,
  tab,
  onChange,
  membersPanel,
  invitesPanel,
  requestsPanel,
  expensesPanel,
}: GroupTabsProps) {
  const base: Tab[] = [
    { key: 'members', label: 'Membros' },
    { key: 'invites', label: 'Convites' },
    { key: 'requests', label: 'Pedidos' },
    { key: 'expenses', label: 'Despesas' },
  ];

  base.push({ key: 'balances', label: 'Saldos' });
  base.push({ key: 'payments', label: 'Pagamentos' });

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-dark-700">
        <nav className="flex space-x-6 overflow-x-auto scrollbar-hide">
          {base.map((item) => (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                tab === item.key
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[200px]">
        {tab === 'members' && membersPanel}
        {tab === 'invites' && invitesPanel}
        {tab === 'requests' && requestsPanel}
        {tab === 'expenses' && expensesPanel}
        {tab === 'balances' && <BalancesPanel divvyId={divvyId} />}
        {tab === 'payments' && <PaymentsPanel divvyId={divvyId} />}
      </div>
    </div>
  );
}
