'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDivvies } from '@/hooks/useDivvies';
import Link from 'next/link';
import Button from '@/components/common/Button';

export default function DashboardPage() {
  const { user } = useAuth();
  const { divvies, loading } = useDivvies(user?.id);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Meus Divvies</h1>
        <Link href="/dashboard/new">
          <Button size="lg">+ Novo Divvy</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : divvies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">Você ainda não tem nenhum grupo de despesas.</p>
          <Link href="/dashboard/new">
            <Button>Criar o primeiro Divvy</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {divvies.map((divvy) => (
            <Link key={divvy.id} href={`/dashboard/divvies/${divvy.id}`}>
              <div className="h-full bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{divvy.name}</h3>
                    {divvy.is_archived && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        Arquivado
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {divvy.description || 'Sem descrição'}
                  </p>
                </div>
                <div className="flex justify-between text-xs text-gray-400 border-t pt-4">
                  <span>{divvy.members?.length || 0} membros</span>
                  <span>{new Date(divvy.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
