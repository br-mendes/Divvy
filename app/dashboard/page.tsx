import Link from 'next/link';

export const metadata = {
  title: 'Dashboard - Divvy',
};

export default function DashboardHomePage() {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Link className="text-sm underline" href="/dashboard/divvies">Meus grupos</Link>
          <Link className="text-sm underline" href="/dashboard/expenses">Despesas</Link>
        </div>
      </header>

      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-700">
          Página restaurada como stub para corrigir o build.
        </p>
      </section>
    </main>
  );
}
