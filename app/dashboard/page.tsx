import Link from 'next/link';
import GroupsListClient from '@/components/groups/GroupsListClient';

export const dynamic = 'force-dynamic';

export default function DashboardHomePage() {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Ações rápidas + seus grupos</p>
        </div>

        <div className="shrink-0 flex gap-2">
          <Link className="text-sm underline" href="/dashboard/expenses">
            Despesas
          </Link>
          <Link className="text-sm underline" href="/groups">
            Meus grupos
          </Link>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/create-divvy"
          className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
        >
          <div className="font-semibold text-gray-900">Criar grupo</div>
          <div className="text-sm text-gray-600 mt-1">
            Comece um novo Divvy e convide membros.
          </div>
        </Link>

        <Link
          href="/dashboard/expenses"
          className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
        >
          <div className="font-semibold text-gray-900">Ver despesas</div>
          <div className="text-sm text-gray-600 mt-1">
            Acompanhe e cadastre gastos rapidamente.
          </div>
        </Link>

        <Link
          href="/profile"
          className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
        >
          <div className="font-semibold text-gray-900">Perfil</div>
          <div className="text-sm text-gray-600 mt-1">Configurações e conta.</div>
        </Link>
      </section>

      <GroupsListClient />
    </main>
  );
}
