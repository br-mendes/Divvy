'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ProfileClient() {
  const sp = useSearchParams();
  const tab = sp.get('tab') || 'account';

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Perfil</h1>
        <Link className="text-sm underline" href="/dashboard">Dashboard</Link>
      </header>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-sm text-gray-600">Aba via querystring:</div>
        <div className="mt-1 font-mono text-gray-900">{tab}</div>

        <p className="mt-3 text-sm text-gray-600">
          Esta página foi ajustada para evitar erro de prerender (useSearchParams precisa estar sob Suspense).
        </p>
      </section>
    </main>
  );
}
