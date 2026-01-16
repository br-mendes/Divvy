'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [divvies, setDivvies] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/groups');
    const data = await res.json();
    setDivvies(data.divvies ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type: 'other' }),
    });

    if (res.ok) {
      setName('');
      load();
    } else {
      const err = await res.json();
      alert(err.error ?? 'Erro');
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Meus Grupos</h1>

      <form onSubmit={createGroup} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Nome do grupo"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="border rounded px-4 py-2" type="submit">
          Criar
        </button>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-3">
          {divvies.map((d) => (
            <div key={d.id} className="border rounded p-4">
              <div className="font-semibold">{d.name}</div>
              <div className="text-sm opacity-70">{d.type}</div>
            </div>
          ))}
          {divvies.length === 0 && <p className="opacity-70">Nenhum grupo ainda.</p>}
        </div>
      )}
    </div>
  );
}
