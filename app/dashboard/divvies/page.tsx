import GroupsListClient from '@/components/groups/GroupsListClient';

export const dynamic = 'force-dynamic';

export default function DashboardDivviesIndexPage() {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Meus grupos</h1>
        <p className="text-sm text-gray-600">
          (Compat) Esta rota existe por legado: <span className="font-mono">/dashboard/divvies</span>.
          A tela principal é <span className="font-mono">/groups</span>.
        </p>
      </header>

      <GroupsListClient />
    </main>
  );
}
