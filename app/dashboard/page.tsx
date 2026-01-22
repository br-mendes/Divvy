import Link from 'next/link';
import GroupsListClient from '@/components/groups/GroupsListClient';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Lista rápida dos seus grupos. (A UI de métricas volta na próxima etapa.)
          </p>
        </div>

        <div className="flex gap-2">
          <Link className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50" href="/groups">
            Abrir /groups
          </Link>
          <Link className="rounded-md bg-black px-4 py-2 text-sm text-white hover:opacity-90" href="/dashboard/create-divvy">
            + Criar grupo
          </Link>
        </div>
      </header>

      <GroupsListClient />
    </main>
  );
}
