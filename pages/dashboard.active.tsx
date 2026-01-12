
import React, { useEffect, useState } from 'react';
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
import { Archive, LayoutGrid } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  useEffect(() => {
    if (user) fetchDivvies();
  }, [user]);

  async function fetchDivvies() {
    try {
      if (!user) return;
      
      // Tentamos primeiro pelo RPC que é mais performático para o Dashboard completo
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_divvies');

      if (!rpcError && rpcData) {
        setDivvies(rpcData as Divvy[]);
      } else {
        // Fallback: Busca direta via tabelas caso o RPC falhe ou esteja desatualizado
        // Graças ao RLS (ajustado via SQL), esta query retornará apenas o que o usuário tem acesso
        const { data: directData, error: directError } = await supabase
          .from('divvies')
          .select(`
            *,
            divvy_members!inner(user_id)
          `)
          .order('created_at', { ascending: false });

        if (directError) throw directError;
        setDivvies(directData as any[]);
      }

    } catch (err: any) {
      console.error("Fetch Divvies Error:", err);
      if (err.message && err.message !== 'Failed to fetch') {
          toast.error('Não foi possível carregar seus grupos.');
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredDivvies = divvies.filter(d => 
    viewMode === 'active' ? !d.is_archived : d.is_archived
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 py-8 px-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Grupos</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie suas despesas compartilhadas</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
             {viewMode === 'active' && (
                <Button 
                    onClick={() => setShowForm(!showForm)} 
                    variant={showForm ? 'outline' : 'primary'}
                    className="flex-1 md:flex-none"
                >
                    {showForm ? 'Cancelar' : '+ Novo Grupo'}
                </Button>
             )}
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-dark-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => { setViewMode('active'); setShowForm(false); }}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                viewMode === 'active'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <LayoutGrid size={18} />
              Ativos ({divvies.filter(d => !d.is_archived).length})
            </button>
            <button
              onClick={() => { setViewMode('archived'); setShowForm(false); }}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                viewMode === 'archived'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Archive size={18} />
              Arquivados ({divvies.filter(d => d.is_archived).length})
            </button>
          </nav>
        </div>

        {showForm && viewMode === 'active' && (
          <div className="p-6 bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-brand-100 dark:border-dark-700 animate-fade-in-down">
            <DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} />
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : filteredDivvies.length > 0 ? (
          <DivvyList divvies={filteredDivvies} onRefresh={fetchDivvies} />
        ) : (
          <EmptyState 
            message={viewMode === 'active' ? "Nenhum grupo ativo" : "Nenhum grupo arquivado"} 
            description={viewMode === 'active' ? "Crie um novo grupo para começar!" : "Seus grupos antigos aparecerão aqui."}
          />
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}
