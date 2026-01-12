
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
import { Archive, LayoutGrid, Plus, Sparkles, RefreshCcw, WifiOff } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [hasError, setHasError] = useState(false);

  const fetchDivvies = useCallback(async (silent = false) => {
    if (!user) return;
    
    if (!silent) setLoading(true);
    setHasError(false);

    try {
      // CHAMADA RPC (Remote Procedure Call)
      // Esta função executa no banco com permissões de sistema,
      // contornando qualquer problema de RLS (Row Level Security).
      const { data, error } = await supabase.rpc('get_dashboard_divvies');

      if (error) throw error;

      if (data) {
        // Garantir que member_count seja número (Postgres retorna bigint como string as vezes)
        const formattedData: Divvy[] = data.map((d: any) => ({
            ...d,
            member_count: Number(d.member_count || 1)
        }));
        setDivvies(formattedData);
      } else {
        setDivvies([]);
      }

    } catch (err: any) {
      console.error("Dashboard RPC Error:", err);
      setHasError(true);
      // Evita spam de erro se for apenas atualização em background
      if (!silent) {
        // Se o erro for "function not found", o usuário esqueceu de rodar o SQL
        if (err.message?.includes('function') && err.message?.includes('not found')) {
            toast.error('Erro de Configuração: Execute o script SQL fornecido.');
        } else {
            toast.error('Não foi possível carregar os grupos.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDivvies();
    
    // Inscrição simplificada para atualizações
    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'divvies' }, () => fetchDivvies(true))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDivvies]);

  const filteredDivvies = divvies.filter(d => 
    viewMode === 'active' ? !d.is_archived : d.is_archived
  );

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-300 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
              Olá, {displayName} <Sparkles className="text-brand-500 fill-brand-500/20" size={28} />
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              Gerencie suas despesas compartilhadas.
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto animate-fade-in-up">
            <button 
              onClick={() => fetchDivvies()}
              className="p-3 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
              title="Sincronizar agora"
            >
              <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <Button 
                onClick={() => setShowForm(!showForm)} 
                variant={showForm ? 'outline' : 'primary'}
                className="flex-1 md:flex-none h-12 rounded-xl font-bold shadow-lg shadow-brand-500/20 px-6"
            >
                {showForm ? 'Cancelar' : <><Plus size={18} className="mr-2" /> Novo Grupo</>}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-gray-200 dark:border-dark-800 w-fit shadow-sm">
          <button
            onClick={() => { setViewMode('active'); setShowForm(false); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              viewMode === 'active'
                ? 'bg-brand-600 text-white shadow-md scale-[1.02]'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-800'
            }`}
          >
            <LayoutGrid size={16} /> Ativos
          </button>
          <button
            onClick={() => { setViewMode('archived'); setShowForm(false); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              viewMode === 'archived'
                ? 'bg-brand-600 text-white shadow-md scale-[1.02]'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-800'
            }`}
          >
            <Archive size={16} /> Arquivados
          </button>
        </div>

        {/* Form Container */}
        {showForm && (
          <div className="p-6 md:p-8 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-3xl shadow-xl animate-fade-in-up ring-4 ring-gray-50 dark:ring-dark-800/50">
            <DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} />
          </div>
        )}

        {/* List Content */}
        <div className="min-h-[400px]">
          {loading && divvies.length === 0 ? (
            <div className="py-32 flex flex-col items-center gap-4">
              <LoadingSpinner />
              <p className="text-gray-400 text-sm animate-pulse font-medium">Buscando seus grupos...</p>
            </div>
          ) : hasError && divvies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                    <WifiOff className="text-red-500" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Erro de Conexão</h3>
                <p className="text-gray-500 max-w-sm mb-6">
                    Não foi possível carregar seus grupos. Verifique se o script SQL foi executado no Supabase.
                </p>
                <Button onClick={() => fetchDivvies()}>Tentar Novamente</Button>
            </div>
          ) : filteredDivvies.length > 0 ? (
            <div className="animate-fade-in-up">
              <DivvyList divvies={filteredDivvies} onRefresh={fetchDivvies} />
            </div>
          ) : (
            <div className="pt-12">
              <EmptyState 
                message={viewMode === 'active' ? "Tudo limpo por aqui!" : "Arquivo vazio"} 
                description={
                  viewMode === 'active' 
                  ? "Seus grupos ativos aparecerão aqui. Crie um novo grupo para começar." 
                  : "Grupos que você arquivar ficarão guardados aqui."
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}
