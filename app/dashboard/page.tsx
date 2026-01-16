'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Button from '@/components/common/Button';

export default function Dashboard() {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data } = await supabase
        .from('divvies')
        .select('*')
        .or(`creator_id.eq.${user.id}`); 
        // Nota: Em produção, filtrar também por membros
      setDivvies(data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Meus Divvies</h1>
        <Link href="/dashboard/new">
          <Button>+ Novo Divvy</Button>
        </Link>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : divvies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Você ainda não tem nenhum grupo de despesas.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {divvies.map(divvy => (
            <Link key={divvy.id} href={`/dashboard/divvies/${divvy.id}`}>
              <div className="border p-4 rounded-lg hover:shadow-md transition bg-white">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{divvy.name}</h3>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {divvy.is_archived ? 'Arquivado' : 'Ativo'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2 line-clamp-2">{divvy.description || 'Sem descrição'}</p>
                <div className="mt-4 text-xs text-gray-400">
                  Criado em {new Date(divvy.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
