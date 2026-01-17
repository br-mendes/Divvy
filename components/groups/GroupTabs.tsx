'use client';

import { useState } from 'react';
import { BalancesPanel } from '@/components/groups/BalancesPanel';
import { ExpensesPanel } from '@/components/groups/ExpensesPanel';
import { PaymentsPanel } from '@/components/groups/PaymentsPanel';

const tabs = [
  { id: 'expenses', label: 'Despesas' },
  { id: 'balances', label: 'Saldos' },
  { id: 'payments', label: 'Pagamentos' },
] as const;

type TabId = (typeof tabs)[number]['id'];

type GroupTabsProps = {
  divvyId: string;
  membersCount: number;
};

export function GroupTabs({ divvyId, membersCount }: GroupTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('expenses');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`border-b-2 px-2 py-2 text-sm ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500'
            }`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-gray-500">
          {membersCount} membros
        </div>
      </div>

      {activeTab === 'expenses' && <ExpensesPanel divvyId={divvyId} />}
      {activeTab === 'balances' && <BalancesPanel divvyId={divvyId} />}
      {activeTab === 'payments' && <PaymentsPanel divvyId={divvyId} />}
    </div>
  );
}
