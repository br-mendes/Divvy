import Link from 'next/link';
import GroupsListClient from '@/components/groups/GroupsListClient';

export const dynamic = 'force-dynamic';

export default function GroupsIndexPage() {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus grupos</h1>
          <p className="text-sm text-gray-600">Escolha um grupo para ver despesas, categorias, saldos e membros.</p>
        </div>

        <Link
          href="/dashboard/create-divvy"
          className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Criar grupo
        </Link>
      </header>

      <GroupsListClient />
    </main>
  );
}
