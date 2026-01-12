
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Divvy } from '../types';
import { Button } from '../components/ui/Button';
import DivvyList from '../components/divvy/DivvyList';
import DivvyForm from '../components/divvy/DivvyForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Archive, LayoutGrid, Plus } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  const fetchDivvies = useCallback(async () => {
    if (!user) return;
    
    try {
      // Estratégia de busca mais resiliente: Busca os IDs através da tabela de membros primeiro
      const { data: memberRows, error: memberError } = await supabase
        .from('divvy_members')
        .select(`
          divvy_id,
          divvies (*)
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Mapeia os resultados para o formato Divvy, removendo nulos caso o RLS filtre algo inesperado
      const groups = (memberRows || [])
        .map(row => row.divvies)
        .filter(Boolean) as unknown as Divvy[];

      // Ordenação manual para garantir consistência
      const sortedGroups = groups.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setDivvies(sortedGroups);
    } catch (err: any) {
      console.error("Fetch Divvies Error:", err);
      // Evita spam de erro se for apenas um problema de conexão temporária
      if (err.message !== 'Failed to fetch') {
          toast.error('Erro ao carregar grupos. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDivvies();
  }, [fetchDivvies]);

  const filteredDivvies = divvies.filter(d => 
    viewMode === 'active' ? !d.is_archived : d.is_archived
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-8 px-4 transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Meus Grupos</h1>
            <p className="text-sm text-gray-500 dark:text-dark-500">Acompanhe suas finanças compartilhadas</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
             {viewMode === 'active' && (
                <Button 
                    onClick={() => setShowForm(!showForm)} 
                    variant={showForm ? 'outline' : 'primary'}
                    className="flex-1 md:flex-none shadow-lg shadow-brand-500/10 active:scale-95 transition-transform"
                >
                    {showForm ? 'Cancelar' : <><Plus size={18} className="mr-2" /> Novo Grupo</>}
                </Button>
             )}
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-dark-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => { setViewMode('active'); setShowForm(false); }}
              className={`pb-4 px-2 border-b-2 font-bold text-sm flex items-center gap-2 transition-all ${
                viewMode === 'active'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 dark:text-dark-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <LayoutGrid size={18} />
              Ativos ({divvies.filter(d => !d.is_archived).length})
            </button>
            <button
              onClick={() => { setViewMode('archived'); setShowForm(false); }}
              className={`pb-4 px-2 border-b-2 font-bold text-sm flex items-center gap-2 transition-all ${
                viewMode === 'archived'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 dark:text-dark-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Archive size={18} />
              Arquivados ({divvies.filter(d => d.is_archived).length})
            </button>
          </nav>
        </div>

        {showForm && viewMode === 'active' && (
          <div className="p-6 bg-white dark:bg-dark-900 rounded-[2rem] shadow-xl border border-brand-100 dark:border-dark-700 animate-fade-in-down">
            <DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} />
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <LoadingSpinner />
            <p className="text-gray-400 text-sm animate-pulse">Sincronizando seus grupos...</p>
          </div>
        ) : filteredDivvies.length > 0 ? (
          <DivvyList divvies={filteredDivvies} onRefresh={fetchDivvies} />
        ) : (
          <div className="animate-fade-in-down">
            <EmptyState 
              message={viewMode === 'active' ? "Nenhum grupo ativo" : "Nenhum grupo arquivado"} 
              description={viewMode === 'active' ? "Crie um novo grupo para começar a dividir suas despesas!" : "Seus grupos antigos aparecerão aqui quando você os arquivar."}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}
