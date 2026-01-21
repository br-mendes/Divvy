'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

function ProfileInner() {
  const sp = useSearchParams();
  const view = sp.get('view') ?? 'default';

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <p className="text-gray-600">
        Página ajustada para build: uso de <code>useSearchParams()</code> fica dentro de <code>{'<Suspense>'}</code>.
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-600">Query param <span className="font-mono">view</span>:</div>
        <div className="mt-1 text-lg font-semibold">{view}</div>
      </div>

      <p className="text-xs text-gray-500">
        Se você tinha UI real aqui antes, ela pode ser reintroduzida mantendo o padrão Suspense.
      </p>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-gray-500">Carregando perfil...</div>}>
      <ProfileInner />
    </React.Suspense>
  );
}
