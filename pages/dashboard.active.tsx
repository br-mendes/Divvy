
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Divvy, DivvyMember, BroadcastMessage } from '../types';
import { Button } from '../components/ui/Button';
import DivvyList from '../components/divvy/DivvyList';
import DivvyForm from '../components/divvy/DivvyForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Archive, LayoutGrid, Plus, Sparkles, RefreshCcw, Megaphone, X, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Broadcast State
  const [broadcast, setBroadcast] = useState<BroadcastMessage | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(true);

  const fetchBroadcasts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('broadcastmessages')
        .select('*')
        .eq('target', 'all')
        .order('createdat', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setBroadcast(data);
      }
    } catch (err) {
      console.error("Erro ao buscar broadcasts", err);
    }
  }, []);

  const fetchDivvies = useCallback(async (silent = false) => {
    if (!user) return;
    
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      // 1. Buscar grupos onde sou o criador
      const { data: createdGroups, error: createdError } = await supabase
        .from('divvies')
        .select('*')
        .eq('creatorid', user.id);
      
      if (createdError) throw createdError;

      // 2. Buscar IDs dos grupos onde sou apenas membro (participante)
      const { data: membershipRows, error: memberError } = await supabase
        .from('divvymembers')
        .select('divvyid')
        .eq('userid', user.id);
      
      if (memberError) throw memberError;

      const joinedIds = (membershipRows || []).map((m: any) => m.divvyid);
      
      // 3. Buscar os detalhes desses outros grupos
      let joinedGroups: Divvy[] = [];
      if (joinedIds.length > 0) {
        const { data: joinedData } = await supabase
          .from('divvies')
          .select('*')
          .in('id', joinedIds);
        
        if (joinedData) joinedGroups = joinedData;
      }

      // 4. Combinar e remover duplicatas
      const combined = [...(createdGroups || []), ...joinedGroups];
      const uniqueMap = new Map<string, Divvy>();
      combined.forEach(g => {
        if (g && g.id) uniqueMap.set(g.id, g);
      });

      const finalGroups = Array.from(uniqueMap.values());
      const allGroupIds = finalGroups.map(g => g.id);

      // 5. Buscar TODOS os membros de todos esses grupos de uma vez
      const { data: allMembers, error: fetchMembersError } = await supabase
        .from('divvymembers')
        .select(`
          divvyid, 
          userid, 
          email,
          userprofiles:userid (
            id,
            fullname,
            displayname,
            avatarurl
          )
        `)
        .in('divvyid', allGroupIds);

      if (fetchMembersError) throw fetchMembersError;

      // 6. Mapear membros para seus respectivos grupos
      const membersByGroup: Record<string, DivvyMember[]> = {};
      if (allMembers) {
        allMembers.forEach((m: any) => {
          if (!membersByGroup[m.divvyid]) {
            membersByGroup[m.divvyid] = [];
          }
          membersByGroup[m.divvyid].push(m);
        });
      }

      // 7. Enriquecer os objetos dos grupos
      const enrichedDivvies = finalGroups.map(g => {
        const groupMembers = membersByGroup[g.id] || [];
        return {
          ...g,
          members: groupMembers,
          member_count: Math.max(groupMembers.length, 1) 
        };
      });

      // Ordenar por data (createdat)
      enrichedDivvies.sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime());

      setDivvies(enrichedDivvies);
    } catch (err: any) {
      console.error("Dashboard Error:", err);
      setError(err.message || 'Erro ao carregar dados.');
      if (err.message?.includes('infinite recursion')) {
         toast.error("Erro de configuração do banco de dados (Recursão de Política). Contate o administrador.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDivvies();
    fetchBroadcasts();
    
    // Inscrição para atualizações em tempo real
    const channel = supabase.channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'divvies' }, () => fetchDivvies(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'divvymembers' }, () => fetchDivvies(true))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDivvies, fetchBroadcasts]);

  const filteredDivvies = divvies.filter(d => {
    const matchesMode = viewMode === 'active' ? !d.isarchived : d.isarchived;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMode && matchesSearch;
  });

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

  if (error) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-dark-950">
              <div className="text-center max-w-md">
                  <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Erro ao carregar dashboard</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                  <Button onClick={() => fetchDivvies()} variant="outline">Tentar Novamente</Button>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-300 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        
        {/* Broadcast Message Banner */}
        {broadcast && showBroadcast && (
          <div className="animate-fade-in-down bg-gradient-to-r from-purple-600 to-brand-600 rounded-xl p-4 md:p-6 shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
               <Megaphone size={100} transform="rotate(-15)" />
            </div>
            <div className="relative z-10 flex gap-4 items-start pr-8">
               <div className="bg-white/20 p-2 rounded-lg">
                  <Megaphone size={24} />
               </div>
               <div>
                  <h3 className="font-bold text-lg mb-1">{broadcast.title}</h3>
                  <p className="text-white/90 text-sm leading-relaxed">{broadcast.body}</p>
               </div>
            </div>
            <button 
              onClick={() => setShowBroadcast(false)} 
              className="absolute top-2 right-2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

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

        {/* Layout Grid: Groups and Sidebar (Activity Feed) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content: Groups */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
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

                    <div className="relative flex-1 sm:max-w-xs">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar grupos..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-dark-800 bg-white dark:bg-dark-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-shadow shadow-sm"
                        />
                    </div>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="p-6 md:p-8 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-3xl shadow-xl animate-fade-in-up ring-4 ring-gray-50 dark:ring-dark-800/50">
                        <DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} />
                    </div>
                )}

                {/* List */}
                <div className="min-h-[300px]">
                    {loading && divvies.length === 0 ? (
                        <div className="py-32 flex flex-col items-center gap-4">
                        <LoadingSpinner />
                        <p className="text-gray-400 text-sm animate-pulse font-medium">Sincronizando grupos...</p>
                        </div>
                    ) : filteredDivvies.length > 0 ? (
                        <div className="animate-fade-in-up">
                        <DivvyList divvies={filteredDivvies} onRefresh={fetchDivvies} />
                        </div>
                    ) : (
                        <div className="pt-12">
                        <EmptyState 
                            message={searchQuery ? "Nenhum grupo encontrado" : (viewMode === 'active' ? "Nenhum grupo ativo" : "Nenhum grupo arquivado")} 
                            description={
                                searchQuery 
                                ? `Não encontramos grupos com o termo "${searchQuery}".`
                                : (viewMode === 'active' 
                                    ? "Crie um novo grupo para começar a dividir despesas." 
                                    : "Seus grupos arquivados aparecerão aqui.")
                            }
                        />
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar: Activity Feed */}
            <div className="lg:col-span-1 space-y-6">
                <ActivityFeed />
            </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}
