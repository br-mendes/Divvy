
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { Archive, LayoutGrid, Plus, Sparkles, RefreshCcw } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  
  const isFetching = useRef(false);
  const toastId = useRef<string | null>(null);

  const fetchDivvies = useCallback(async (silent = false) => {
    if (!user || isFetching.current) return;
    
    isFetching.current = true;
    if (!silent) setLoading(true);

    try {
      // Método Robusto: Busca através da tabela de membros para garantir visibilidade via RLS
      const { data: memberRows, error } = await supabase
        .from('divvy_members')
        .select('divvies (*)')
        .eq('user_id', user.id);

      if (error) throw error;

      const groups = (memberRows || [])
        .map(row => row.divvies)
        .filter(Boolean) as unknown as Divvy[];

      const sortedGroups = groups.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setDivvies(sortedGroups);
      
      // Limpa erros anteriores se houver sucesso
      if (toastId.current) {
        toast.dismiss(toastId.current);
        toastId.current = null;
      }
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      if (!silent && !toastId.current) {
        toastId.current = toast.error('Sincronizando grupos... Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [user]);

  useEffect(() => {
    fetchDivvies();
  }, [fetchDivvies]);

  const filteredDivvies = divvies.filter(d => 
    viewMode === 'active' ? !d.is_archived : d.is_archived
  );

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-dark-950 transition-colors duration-700 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        
        {/* Hero Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter flex items-center gap-4">
              Olá, {displayName} <Sparkles className="text-brand-400 w-8 h-8 animate-glow-pulse" />
            </h1>
            <p className="text-dark-400 font-medium text-lg">
              Suas finanças compartilhadas em um só lugar.
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => fetchDivvies()}
              className="p-3 bg-dark-900 border border-dark-700 rounded-2xl text-dark-400 hover:text-white transition-all active:rotate-180"
              title="Recarregar"
            >
              <RefreshCcw size={20} />
            </button>
            <Button 
                onClick={() => setShowForm(!showForm)} 
                variant={showForm ? 'outline' : 'primary'}
                className="flex-1 md:flex-none h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-brand-500/20 active:scale-95"
            >
                {showForm ? 'Cancelar' : <><Plus size={20} className="mr-2" /> Criar Grupo</>}
            </Button>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center gap-2 bg-dark-900/50 backdrop-blur-xl p-1.5 rounded-2xl w-fit border border-dark-700/50 shadow-inner">
          <button
            onClick={() => { setViewMode('active'); setShowForm(false); }}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all ${
              viewMode === 'active'
                ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20'
                : 'text-dark-500 hover:text-dark-300'
            }`}
          >
            <LayoutGrid size={16} /> Ativos
          </button>
          <button
            onClick={() => { setViewMode('archived'); setShowForm(false); }}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all ${
              viewMode === 'archived'
                ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20'
                : 'text-dark-500 hover:text-dark-300'
            }`}
          >
            <Archive size={16} /> Arquivos
          </button>
        </div>

        {/* Create Form Area */}
        {showForm && (
          <div className="p-8 bg-dark-900 rounded-[2.5rem] shadow-2xl border border-dark-700 animate-fade-in-up">
            <DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} />
          </div>
        )}

        {/* List Results */}
        <div className="min-h-[500px] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {loading ? (
            <div className="py-40 flex flex-col items-center gap-6">
              <LoadingSpinner />
              <p className="text-dark-500 text-sm font-bold uppercase tracking-[0.3em] animate-pulse">Sincronizando Dados</p>
            </div>
          ) : filteredDivvies.length > 0 ? (
            <DivvyList divvies={filteredDivvies} onRefresh={fetchDivvies} />
          ) : (
            <div className="pt-10">
              <EmptyState 
                message={viewMode === 'active' ? "Tudo limpo por aqui!" : "Sem arquivados"} 
                description={viewMode === 'active' ? "Você não possui grupos ativos no momento. Clique no botão acima para criar o primeiro!" : "Seus grupos arquivados aparecerão nesta seção."}
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
