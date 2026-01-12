
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Divvy } from '../types';
import { Button } from '../components/ui/Button';
import DivvyList from '../components/divvy/DivvyList';
import DivvyForm from '../components/divvy/DivvyForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Archive, LayoutGrid, Plus, Sparkles, RefreshCcw } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDivvies = useCallback(async (silent = false) => {
    if (!user) return;
    
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      // ESTRATÉGIA ANTI-BLOQUEIO (MANUAL JOIN)
      // Evita usar select('divvy:divvies(*)') que dispara recursão de RLS no Supabase
      
      // 1. Grupos que eu criei (Direto)
      const { data: createdData } = await supabase
        .from('divvies')
        .select('*')
        .eq('creator_id', user.id);
      
      const myCreatedGroups = createdData || [];

      // 2. IDs dos grupos onde sou membro
      const { data: membershipData } = await supabase
        .from('divvy_members')
        .select('divvy_id')
        .eq('user_id', user.id);
      
      // Extrair IDs válidos
      const joinedDivvyIds = (membershipData || [])
         .map((m: any) => m.divvy_id)
         .filter((id: string) => id); // Remove nulos
      
      // 3. Buscar detalhes dos grupos onde sou membro (se houver algum)
      let myJoinedGroups: Divvy[] = [];
      if (joinedDivvyIds.length > 0) {
          // Filtra IDs que já pegamos na lista de criados para economizar banda (opcional, mas bom)
          const idsToFetch = joinedDivvyIds.filter((id: string) => !myCreatedGroups.some(c => c.id === id));
          
          if (idsToFetch.length > 0) {
             const { data: joinedData } = await supabase
               .from('divvies')
               .select('*')
               .in('id', idsToFetch);
             
             if (joinedData) myJoinedGroups = joinedData;
          }
      }

      // Unificar listas
      const allGroups = [...myCreatedGroups, ...myJoinedGroups];

      // Remover duplicatas por segurança (Map garante unicidade por ID)
      const uniqueMap = new Map();
      allGroups.forEach(g => {
        if (g && g.id) {
             uniqueMap.set(g.id, { 
                 ...g, 
                 member_count: g.member_count || 1 // Fallback visual
             });
        }
      });
      
      const uniqueDivvies = Array.from(uniqueMap.values());

      // Ordenar: Mais recentes primeiro
      uniqueDivvies.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setDivvies(uniqueDivvies);

    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      // Sem toast de erro aqui para não travar a experiência se for um erro parcial
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDivvies();
    
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
        
        {/* Header */}
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
              title="Atualizar lista"
            >
              <RefreshCcw size={20} className={isRefreshing || loading ? 'animate-spin' : ''} />
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

        {/* Form */}
        {showForm && (
          <div className="p-6 md:p-8 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-3xl shadow-xl animate-fade-in-up ring-4 ring-gray-50 dark:ring-dark-800/50">
            <DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} />
          </div>
        )}

        {/* List & States */}
        <div className="min-h-[400px]">
          {loading && divvies.length === 0 ? (
            <div className="py-32 flex flex-col items-center gap-4">
              <LoadingSpinner />
              <p className="text-gray-400 text-sm animate-pulse font-medium">Carregando seus grupos...</p>
            </div>
          ) : filteredDivvies.length > 0 ? (
            <div className="animate-fade-in-up">
              <DivvyList divvies={filteredDivvies} onRefresh={fetchDivvies} />
            </div>
          ) : (
            <div className="pt-12">
              <EmptyState 
                message={viewMode === 'active' ? "Nenhum grupo ativo" : "Nenhum grupo arquivado"} 
                description={
                  viewMode === 'active' 
                  ? "Crie um novo grupo para começar a dividir despesas." 
                  : "Seus grupos arquivados aparecerão aqui."
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
