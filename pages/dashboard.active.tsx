
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

  const fetchDivvies = useCallback(async (silent = false) => {
    if (!user || isFetching.current) return;
    
    isFetching.current = true;
    if (!silent) setLoading(true);

    try {
      // Busca direta na tabela divvies. O RLS (se configurado com o SQL enviado)
      // filtrará automaticamente os grupos que o usuário participa ou criou.
      const { data, error } = await supabase
        .from('divvies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDivvies(data || []);
    } catch (err: any) {
      console.error("Dashboard Sync Error:", err);
      if (!silent) {
        toast.error('Erro ao sincronizar seus grupos.');
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-300 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              Olá, {displayName} <Sparkles className="text-brand-500 animate-pulse" size={28} />
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gerencie suas despesas e saldos compartilhados.
            </p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto animate-fade-in-up">
            <button 
              onClick={() => fetchDivvies()}
              className="p-2.5 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl transition-all"
              title="Atualizar"
            >
              <RefreshCcw size={20} />
            </button>
            <Button 
                onClick={() => setShowForm(!showForm)} 
                variant={showForm ? 'outline' : 'primary'}
                className="flex-1 md:flex-none h-12 rounded-xl font-bold"
            >
                {showForm ? 'Cancelar' : <><Plus size={18} className="mr-2" /> Novo Grupo</>}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex bg-white dark:bg-dark-900 p-1 rounded-xl border border-gray-200 dark:border-dark-800 w-fit">
          <button
            onClick={() => { setViewMode('active'); setShowForm(false); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'active'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <LayoutGrid size={16} /> Ativos
          </button>
          <button
            onClick={() => { setViewMode('archived'); setShowForm(false); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              viewMode === 'archived'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Archive size={16} /> Arquivados
          </button>
        </div>

        {/* Form Container */}
        {showForm && (
          <div className="p-6 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-2xl shadow-sm animate-fade-in-up">
            <DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} />
          </div>
        )}

        {/* List Content */}
        <div className="min-h-[400px]">
          {loading ? (
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
                message={viewMode === 'active' ? "Tudo limpo por aqui!" : "Sem arquivados"} 
                description={
                  viewMode === 'active' 
                  ? "Crie seu primeiro grupo para começar a dividir gastos com seus amigos." 
                  : "Não há grupos arquivados para exibir."
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
