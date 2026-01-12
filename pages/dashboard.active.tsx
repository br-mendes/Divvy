
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
      // CONSULTA DIRETA: O RLS do banco de dados fará o filtro automaticamente
      // Isso evita erros de Join que causam o erro de sincronização
      const { data, error } = await supabase
        .from('divvies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDivvies(data || []);
      
      // Se deu certo, remove qualquer aviso de erro persistente
      if (toastId.current) {
        toast.dismiss(toastId.current);
        toastId.current = null;
      }
    } catch (err: any) {
      console.error("Dashboard Sync Error:", err);
      // Evita disparar múltiplos toasts se um já estiver visível
      if (!silent && !toastId.current) {
        toastId.current = toast.error('Sincronizando grupos...', {
          duration: 4000,
          icon: '🔄'
        });
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
    <div className="min-h-screen bg-[#000000] transition-colors duration-700 pb-20 selection:bg-brand-500/30">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        
        {/* Hero Section Premium */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-fade-in-up">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                Olá, {displayName}
              </h1>
              <Sparkles className="text-brand-400 w-8 h-8 md:w-10 md:h-10 animate-glow-pulse" />
            </div>
            <p className="text-dark-400 font-medium text-lg md:text-xl">
              Gerencie suas finanças compartilhadas com elegância.
            </p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={() => fetchDivvies()}
              className="p-4 bg-dark-900 border border-dark-700 rounded-[1.25rem] text-dark-400 hover:text-white transition-all active:scale-90"
              title="Atualizar"
            >
              <RefreshCcw size={24} />
            </button>
            <Button 
                onClick={() => setShowForm(!showForm)} 
                variant={showForm ? 'outline' : 'primary'}
                className="flex-1 md:flex-none h-16 px-10 rounded-[1.25rem] font-black uppercase tracking-[0.15em] text-xs shadow-[0_0_30px_rgba(139,92,246,0.15)] active:scale-95 transition-all"
            >
                {showForm ? 'Cancelar' : <><Plus size={20} className="mr-3" /> Criar Novo Grupo</>}
            </Button>
          </div>
        </div>

        {/* Tab Switcher OLED Style */}
        <div className="flex items-center gap-2 bg-dark-900/40 backdrop-blur-3xl p-2 rounded-[1.5rem] w-fit border border-dark-700/50 shadow-inner">
          <button
            onClick={() => { setViewMode('active'); setShowForm(false); }}
            className={`flex items-center gap-3 px-10 py-4 rounded-[1.1rem] text-xs font-black tracking-widest uppercase transition-all duration-300 ${
              viewMode === 'active'
                ? 'bg-brand-600 text-white shadow-[0_10px_20px_rgba(139,92,246,0.3)]'
                : 'text-dark-500 hover:text-dark-300'
            }`}
          >
            <LayoutGrid size={18} /> Ativos ({divvies.filter(d => !d.is_archived).length})
          </button>
          <button
            onClick={() => { setViewMode('archived'); setShowForm(false); }}
            className={`flex items-center gap-3 px-10 py-4 rounded-[1.1rem] text-xs font-black tracking-widest uppercase transition-all duration-300 ${
              viewMode === 'archived'
                ? 'bg-brand-600 text-white shadow-[0_10px_20px_rgba(139,92,246,0.3)]'
                : 'text-dark-500 hover:text-dark-300'
            }`}
          >
            <Archive size={18} /> Arquivos ({divvies.filter(d => d.is_archived).length})
          </button>
        </div>

        {/* Creation Form Overlay */}
        {showForm && (
          <div className="p-10 bg-dark-900 border border-dark-700 rounded-[2.5rem] shadow-2xl animate-fade-in-up">
            <DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} />
          </div>
        )}

        {/* Main Grid Content */}
        <div className="min-h-[500px]">
          {loading ? (
            <div className="py-48 flex flex-col items-center gap-8">
              <LoadingSpinner />
              <div className="space-y-2 text-center">
                <p className="text-dark-500 text-xs font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando</p>
                <p className="text-dark-600 text-[10px] uppercase tracking-widest">Aguardando resposta do banco...</p>
              </div>
            </div>
          ) : filteredDivvies.length > 0 ? (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <DivvyList divvies={filteredDivvies} onRefresh={fetchDivvies} />
            </div>
          ) : (
            <div className="pt-20 opacity-80 animate-fade-in-up">
              <EmptyState 
                message={viewMode === 'active' ? "Tudo limpo por aqui!" : "Sem arquivados"} 
                description={
                  viewMode === 'active' 
                  ? "Você ainda não possui grupos ativos. Que tal criar o primeiro agora?" 
                  : "Seus grupos arquivados para consulta futura aparecerão aqui."
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
