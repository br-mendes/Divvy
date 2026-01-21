'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ExpensesPanel } from '@/components/groups/ExpensesPanel';
import { MembersPanel } from '@/components/groups/MembersPanel';
import { InvitesPanel } from '@/components/groups/InvitesPanel';
import { RemovalRequestsPanel } from '@/components/groups/RemovalRequestsPanel';

type TabKey = 'members' | 'invites' | 'requests' | 'expenses';

export function GroupTabs({
  divvyId,
  membersCount,
}: {
  divvyId: string;
  membersCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialTab = (searchParams.get('tab') as TabKey) || 'members';
  const [tab, setTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    const urlTab = (searchParams.get('tab') as TabKey) || 'members';
    // Mantém em sincronia se alguém mexer no URL
    setTab(urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('tab')]);

  function go(next: TabKey) {
    setTab(next);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', next);
    router.replace(`${pathname}?${sp.toString()}`);
  }

  const tabs = useMemo(
    () => [
      { key: 'expenses' as const, label: 'Despesas' },
      { key: 'members' as const, label: `Membros (${membersCount})` },
      { key: 'invites' as const, label: 'Convites' },
      { key: 'requests' as const, label: 'Pedidos' },
    ],
    [membersCount],
  );

  return (
    <div className="border rounded">
      {/* Tabs header */}
      <div className="flex gap-2 border-b p-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={[
              'px-3 py-2 rounded border text-sm whitespace-nowrap',
              tab === t.key ? 'font-semibold' : 'opacity-70',
            ].join(' ')}
            onClick={() => go(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabs content */}
      <div className="p-4">
        {tab === 'expenses' && <ExpensesPanel divvyId={divvyId} />}
        {tab === 'members' && <MembersPanel divvyId={divvyId} />}
        {tab === 'invites' && <InvitesPanel divvyId={divvyId} />}

        {/*
          Important: o RemovalRequestsPanel já retorna null em 403, então:
          - Se usuário não tiver permissão, a aba “Pedidos” fica vazia.
          - A gente trata isso com um texto de fallback.
        */}
        {tab === 'requests' && (
          <div className="space-y-3">
            <RemovalRequestsPanel divvyId={divvyId} />
            <p className="text-sm opacity-70">
              Se você não for criador/admin do grupo (ou admin global), esta seção não aparece.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
