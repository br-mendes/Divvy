'use client';

import Link from 'next/link';

type Props = {
  params: { id: string };
};

export default function DivvyDetailsPage({ params }: Props) {
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grupo</h1>
          <p className="text-sm text-gray-600">ID: {params.id}</p>
        </div>
        <Link className="text-sm underline" href="/dashboard/divvies">
          Voltar
        </Link>
      </header>

      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-700">
          Página restaurada como stub para corrigir o build. Depois replugamos o painel completo do grupo.
        </p>

        <div className="mt-4 flex gap-3">
          <Link className="px-4 py-2 rounded border border-gray-300 text-sm hover:bg-gray-50" href={"/groups/" + params.id}>
            Abrir página do grupo (produto)
          </Link>
          <Link className="px-4 py-2 rounded bg-black text-white text-sm hover:opacity-90" href="/dashboard">
            Voltar ao dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}