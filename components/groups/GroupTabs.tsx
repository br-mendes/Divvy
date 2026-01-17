'use client';

import type { ReactNode } from 'react';

import { PeriodsPanel } from './PeriodsPanel';

type Tab = {
  key: TabKey;
  label: string;
};

type Permissions = {
  canManagePeriods?: boolean;
};

export type TabKey = 'periods' | (string & {});

type GroupTabsProps = {
  divvyId: string;
  permissions?: Permissions;
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
  tabs: Tab[];
  renderTab: (tab: TabKey) => ReactNode;
};

export function GroupTabs({
  divvyId,
  permissions,
  tab,
  onTabChange,
  tabs,
  renderTab,
}: GroupTabsProps) {
  const base = [...tabs];

  if (permissions?.canManagePeriods) base.push({ key: 'periods', label: 'Períodos' });

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
          {base.map((item) => (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                tab === item.key
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[200px]">
        {tab === 'periods' ? <PeriodsPanel divvyId={divvyId} /> : renderTab(tab)}
      </div>
    </div>
  );
}
