'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { BalancesPanel } from '@/components/groups/BalancesPanel';
import { CategoriesPanel } from '@/components/groups/CategoriesPanel';
import GroupTabs, { type GroupTabKey } from '@/components/groups/GroupTabs';
import { InvitesPanel } from '@/components/groups/InvitesPanel';
import { MembersPanel } from '@/components/groups/MembersPanel';
import { PaymentsPanel } from '@/components/groups/PaymentsPanel';
import { PeriodPicker } from '@/components/groups/PeriodPicker';
import { PeriodsPanel } from '@/components/groups/PeriodsPanel';
import { RemovalRequestsPanel } from '@/components/groups/RemovalRequestsPanel';
import { RequestsPanel } from '@/components/groups/RequestsPanel';
import ExpenseForm from '@/components/expense/ExpenseForm';
import { Modal } from '@/components/ui/Modal';

type AnyObj = Record<string, any>;

type Member = {
  id: string;
  userid: string;
  email: string | null;
  role: 'admin' | 'member' | 'owner' | string;
  joinedat: string | null;
};

type Expense = {
  id: string;
  divvyId: string;
  paidByUserId: string | null;
  amount: number;
  category: string | null;
  description: string;
  date: string | null;
  createdAt: string | null;
  locked: boolean;
};

function getTab(sp: URLSearchParams): GroupTabKey {
  const raw = sp.get('tab') || 'expenses';
  const allowed: GroupTabKey[] = ['expenses', 'categories', 'balances', 'payments', 'members', 'invites', 'requests', 'periods'];
  return (allowed.includes(raw as any) ? raw : 'expenses') as GroupTabKey;
}

function pick(obj: AnyObj | null | undefined, ...keys: string[]) {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

export default function GroupPageClient({ divvyId }: { divvyId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = React.useMemo(() => getTab(new URLSearchParams(searchParams.toString())), [searchParams]);

  const [loadingGroup, setLoadingGroup] = React.useState(true);
  const [groupError, setGroupError] = React.useState<string | null>(null);
  const [group, setGroup] = React.useState<AnyObj | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [groupRaw, setGroupRaw] = React.useState<any>(null);

  const [expensesLoading, setExpensesLoading] = React.useState(false);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [expensesRaw, setExpensesRaw] = React.useState<any>(null);

  const [createOpen, setCreateOpen] = React.useState(false);

  function onTabChange(next: GroupTabKey) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', next);
    router.replace(`${pathname}?${sp.toString()}`);
  }

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoadingGroup(true);
      setGroupError(null);

      const res = await fetch(`/api/groups/${divvyId}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));

      if (!alive) return;

      setGroupRaw({ status: res.status, ok: res.ok, body: json });

      if (!res.ok) {
        setGroupError(String(json?.message || json?.error || `Falha ao carregar grupo (HTTP ${res.status})`));
        setGroup(null);
        setMembers([]);
      } else {
        const g = (json?.group ?? json?.data ?? json) as AnyObj;
        setGroup(g);
        setMembers(Array.isArray(json?.members) ? (json.members as Member[]) : []);
      }

      setLoadingGroup(false);
    })();

    return () => {
      alive = false;
    };
  }, [divvyId]);

  const groupName = (pick(group, 'name', 'title') as string) || 'Grupo';
  const groupDesc = (pick(group, 'description', 'details') as string) || '';
  const createdAt = pick(group, 'created_at', 'createdat') as string | undefined;

  async function loadExpenses() {
    const sp = new URLSearchParams(searchParams.toString());
    const from = sp.get('from') || '';
    const to = sp.get('to') || '';
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);

    setExpensesLoading(true);

    const res = await fetch(`/api/groups/${divvyId}/expenses?${q.toString()}`, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    setExpensesRaw({ status: res.status, ok: res.ok, body: json });

    if (res.ok) {
      setExpenses(Array.isArray(json?.expenses) ? (json.expenses as Expense[]) : []);
    } else {
      setExpenses([]);
    }

    setExpensesLoading(false);
  }

  React.useEffect(() => {
    if (tab !== 'expenses') return;
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, divvyId, searchParams]);

  const emailByUserId = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const x of members) {
      if (x.userid && x.email) m.set(x.userid, x.email);
    }
    return m;
  }, [members]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Link className="text-sm underline text-gray-700" href="/groups">
              ← Voltar
            </Link>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600">{divvyId}</span>
          </div>

          <h1 className="mt-2 truncate text-2xl font-bold text-gray-900">{groupName}</h1>
          {groupDesc ? <p className="mt-1 text-sm text-gray-600">{groupDesc}</p> : null}
          {createdAt ? (
            <p className="mt-2 text-xs text-gray-500">Criado em {new Date(createdAt).toLocaleDateString('pt-BR')}</p>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Link
            href={`/api/groups/${divvyId}/expenses/export.csv`}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Exportar CSV
          </Link>
          <button
            className="inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-sm text-white hover:opacity-90"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            + Nova despesa
          </button>
        </div>
      </header>

      <PeriodPicker />

      {loadingGroup ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">Carregando dados do grupo…</div>
      ) : groupError ? (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="font-semibold text-red-800">Erro</div>
          <div className="text-sm text-red-700">{groupError}</div>
          <details className="text-xs text-red-800">
            <summary className="cursor-pointer">Debug</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify(groupRaw, null, 2)}</pre>
          </details>
        </div>
      ) : null}

      <GroupTabs value={tab} onChange={onTabChange} />

      {tab === 'expenses' ? (
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Despesas</h2>
            <button className="border rounded px-3 py-1" onClick={loadExpenses} type="button" disabled={expensesLoading}>
              Recarregar
            </button>
          </div>

          {expensesLoading ? (
            <div className="text-sm text-gray-600">Carregando…</div>
          ) : expenses.length === 0 ? (
            <div className="text-sm text-gray-600">Nenhuma despesa no período.</div>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <div key={e.id} className="border rounded p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{e.description || 'Sem descrição'}</div>
                    <div className="text-xs text-gray-500">
                      {e.date ? e.date : 'sem data'}
                      {e.category ? ` • ${e.category}` : ''}
                      {e.locked ? ' • bloqueada' : ''}
                    </div>
                    {e.paidByUserId ? (
                      <div className="text-xs text-gray-500">
                        pagou: {emailByUserId.get(e.paidByUserId) ?? e.paidByUserId}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 font-semibold">
                    R$ {Number(e.amount ?? 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-gray-700">Debug /api/groups/{divvyId}/expenses</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-800">{JSON.stringify(expensesRaw, null, 2)}</pre>
          </details>
        </section>
      ) : null}

      {tab === 'categories' ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <CategoriesPanel divvyId={divvyId} />
        </section>
      ) : null}

      {tab === 'balances' ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <BalancesPanel divvyId={divvyId} />
        </section>
      ) : null}

      {tab === 'payments' ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <PaymentsPanel divvyId={divvyId} />
        </section>
      ) : null}

      {tab === 'members' ? (
        <section className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
          <MembersPanel divvyId={divvyId} />
          <RequestsPanel divvyId={divvyId} members={members} />
          <RemovalRequestsPanel divvyId={divvyId} />
        </section>
      ) : null}

      {tab === 'invites' ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <InvitesPanel divvyId={divvyId} />
        </section>
      ) : null}

      {tab === 'requests' ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <RequestsPanel divvyId={divvyId} members={members} />
        </section>
      ) : null}

      {tab === 'periods' ? (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <PeriodsPanel divvyId={divvyId} />
        </section>
      ) : null}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nova despesa">
        <ExpenseForm
          divvyId={divvyId}
          members={(members as any) ?? []}
          onCancel={() => setCreateOpen(false)}
          onSuccess={async () => {
            setCreateOpen(false);
            if (tab === 'expenses') await loadExpenses();
          }}
        />
      </Modal>
    </main>
  );
}
