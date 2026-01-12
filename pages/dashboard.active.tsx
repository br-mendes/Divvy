
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
import { Archive, LayoutGrid, Plus, Sparkles } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  const fetchDivvies = useCallback(async () => {
    if (!user) return;
    
    try {
      // Método Simplificado: Busca diretamente na tabela divvies. 
      // O RLS (configurado via SQL) filtrará automaticamente apenas os grupos que o usuário pertence.
      const { data, error } = await supabase
        .from('divvies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDivvies(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      // Notifica erro apenas se não for um cancelamento de fetch do navegador
      if (err.message && !err.message.includes('fetch')) {
         toast.error('Não foi possível sincronizar seus grupos.');
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

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário';

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950 transition-colors duration-700">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header de Saudação */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in-up">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              Olá, {displayName} <Sparkles className="text-brand-400 w-6 h-6" />
            </h1>
            <p className="text-gray-500 dark:text-dark-500 font-medium italic">
              Seu resumo financeiro está atualizado.
            </p>
          </div>
          
          <Button 
              onClick={() => setShowForm(!showForm)} 
              variant={showForm ? 'outline' : 'primary'}
              className="w-full md:w-auto shadow-xl shadow-brand-500/10 rounded-2xl h-12 px-8 font-bold text-base transition-all active:scale-95"
          >
              {showForm ? 'Cancelar' : <><Plus size={20} className="mr-2" /> Novo Grupo</>}
          </Button>
        </div>

        {/* Tabs de Filtro */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-900 p-1.5 rounded-2xl w-fit border border-gray-200 dark:border-dark-700">
          <button
            onClick={() => { setViewMode('active'); setShowForm(false); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'active'
                ? 'bg-white dark:bg-dark-800 text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-gray-500 dark:text-dark-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <LayoutGrid size={18} /> Ativos
          </button>
          <button
            onClick={() => { setViewMode('archived'); setShowForm(false); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'archived'
                ? 'bg-white dark:bg-dark-800 text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                : 'text-gray-500 dark:text-dark-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Archive size={18} /> Arquivados
          </button>
        </div>

        {/* Formulário de Criação */}
        {showForm && (
          <div className="p-8 bg-white dark:bg-dark-800 rounded-[2.5rem] shadow-2xl border border-brand-100/50 dark:border-dark-700 animate-fade-in-down">
            <DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} />
          </div>
        )}

        {/* Listagem ou Estados Vazios */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="py-32 flex flex-col items-center gap-6">
              <LoadingSpinner />
              <p className="text-gray-400 dark:text-dark-500 text-sm font-medium animate-pulse">Sincronizando com o banco...</p>
            </div>
          ) : filteredDivvies.length > 0 ? (
            <DivvyList divvies={filteredDivvies} onRefresh={fetchDivvies} />
          ) : (
            <div className="animate-fade-in-up">
              <EmptyState 
                message={viewMode === 'active' ? "Tudo limpo por aqui!" : "Sem arquivos"} 
                description={viewMode === 'active' ? "Crie seu primeiro grupo para começar a dividir gastos com amigos." : "Você ainda não arquivou nenhum grupo."}
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
