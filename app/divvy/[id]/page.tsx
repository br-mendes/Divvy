import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Props = { params: { id: string } };

export default function DivvyLegacyPage({ params }: Props) {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Divvy</h1>
      <p className="text-gray-600">
        Stub criado para corrigir build (dependência de ícones/exports).
      </p>
      <div className="flex gap-3">
        <Link className="underline" href={/groups/}>Abrir grupo</Link>
        <Link className="underline" href="/dashboard">Dashboard</Link>
      </div>
      <p className="text-xs text-gray-500">ID: {params.id}</p>
    </main>
  );
}