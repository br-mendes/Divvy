'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateDivvyPage() {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<'trip' | 'group' | 'home'>('trip');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.message || json?.payload?.message || 'Falha ao criar grupo');
      }

      const id = json?.group?.id;
      if (!id) throw new Error('Resposta sem id do grupo');

      // vai direto para o grupo (rota que já está viva)
      router.push(`/groups/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Criar Divvy</h1>
        <Link className="underline text-sm" href="/dashboard/divvies">Voltar</Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Nome</label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Viagem RJ"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Tipo</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="trip">trip</option>
            <option value="group">group</option>
            <option value="home">home</option>
          </select>
          <p className="text-xs text-gray-500">Seu banco exige type NOT NULL; padrão: trip.</p>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          disabled={loading}
          className={[
            'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
            'bg-black text-white hover:bg-gray-900',
            loading ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
          type="submit"
        >
          {loading ? 'Criando…' : 'Criar'}
        </button>
      </form>

      <div className="text-xs text-gray-500">
        Dica: depois de criar, o backend tenta criar membership via RPC <code>ensure_divvy_membership</code> (com fallback).
      </div>
    </main>
  );
}
