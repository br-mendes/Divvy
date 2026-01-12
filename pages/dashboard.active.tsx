
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Divvy, DivvyMember, BroadcastMessage } from '../types';
import { Button } from '../components/ui/Button';
import DivvyList from '../components/divvy/DivvyList';
import DivvyForm from '../components/divvy/DivvyForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Archive, LayoutGrid, Plus, Sparkles, RefreshCcw, Megaphone, X } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Broadcast State
  const [broadcast, setBroadcast] = useState<BroadcastMessage | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(true);

  const fetchBroadcasts = useCallback(async () => {
    try {
      // Buscar a mensagem global mais recente (target = 'all')
      // Em uma implementação mais complexa, filtraríamos por 'active'/'inactive' baseado no login do usuário
      const { data, error } = await supabase
        .from('broadcastmessages')
        .select('*')
        .eq('target', 'all')
        .order('createdat', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        // Verificar se já foi fechada nesta sessão (opcional, aqui usando estado simples)
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
    } catch (err) {
      console.error("Dashboard Error:", err);
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

  const filteredDivvies = divvies.filter(d => 
    viewMode === 'active' ? !d.isarchived : d.isarchived
  );

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuário';

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

        {/* List */}
        <div className="min-h-[400px]">
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
