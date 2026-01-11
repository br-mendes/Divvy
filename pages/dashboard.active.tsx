
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
      
      // 1. Fetch Created Divvies (Basic Fetch)
      const { data: createdData, error: createdError } = await supabase
        .from('divvies')
        .select('*')
        .eq('creator_id', user.id);

      if (createdError) throw createdError;

      // 2. Fetch Shared Divvies (Basic Fetch)
      const { data: memberData, error: memberError } = await supabase
        .from('divvy_members')
        .select('divvies(*)')
        .eq('user_id', user.id);

      if (memberError) throw memberError;
      
      // Extract Divvies from memberData
      const sharedDivvies = (memberData || [])
        .map((d: any) => d.divvies)
        .filter((d: any) => d !== null);

      // Combine and unique
      const allDivvies = [...(createdData || []), ...sharedDivvies];
      const uniqueDivviesMap = new Map();
      allDivvies.forEach(d => uniqueDivviesMap.set(d.id, d));
      const uniqueDivvies = Array.from(uniqueDivviesMap.values());

      if (uniqueDivvies.length === 0) {
        setDivvies([]);
        setLoading(false);
        return;
      }

      // 3. Fetch Member Counts in a separate query to avoid deep nesting issues
      const divvyIds = uniqueDivvies.map((d: any) => d.id);
      
      const { data: membersCountData, error: countError } = await supabase
        .from('divvy_members')
        .select('divvy_id')
        .in('divvy_id', divvyIds);

      // Aggregate counts locally
      const counts: Record<string, number> = {};
      if (membersCountData && !countError) {
        membersCountData.forEach((row: any) => {
           counts[row.divvy_id] = (counts[row.divvy_id] || 0) + 1;
        });
      }

      // Merge counts
      const finalDivvies = uniqueDivvies.map((d: any) => ({
         ...d,
         member_count: counts[d.id] || 1
      })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
      setDivvies(finalDivvies);
    } catch (err: any) {
      console.error("Fetch Divvies Error:", err);
      toast.error('Erro ao carregar seus grupos.');
    } finally {
      setLoading(false);
    }
  }

  const filteredDivvies = divvies.filter(d => 
    viewMode === 'active' ? !d.is_archived : d.is_archived
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Divvies</h1>
            <p className="text-sm text-gray-500">Gerencie suas despesas compartilhadas</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
             {viewMode === 'active' && (
                <Button 
                    onClick={() => setShowForm(!showForm)} 
                    variant={showForm ? 'outline' : 'primary'}
                    className="flex-1 md:flex-none"
                >
                    {showForm ? 'Cancelar' : '+ Novo Divvy'}
                </Button>
             )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => { setViewMode('active'); setShowForm(false); }}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                viewMode === 'active'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LayoutGrid size={18} />
              Ativos ({divvies.filter(d => !d.is_archived).length})
            </button>
            <button
              onClick={() => { setViewMode('archived'); setShowForm(false); }}
              className={`pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                viewMode === 'archived'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Archive size={18} />
              Arquivados ({divvies.filter(d => d.is_archived).length})
            </button>
          </nav>
        </div>

        {showForm && viewMode === 'active' && (
          <div className="p-6 bg-white rounded-xl shadow-sm border border-brand-100 animate-fade-in-down">
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
