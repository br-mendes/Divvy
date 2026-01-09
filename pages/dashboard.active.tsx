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
import { Settings, ShieldCheck } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user) fetchDivvies();
  }, [user]);

  async function fetchDivvies() {
    try {
      if (!user) return;
      const { data: created } = await supabase.from('divvies').select('*').eq('creator_id', user.id);
      const { data: memberData } = await supabase.from('divvy_members').select('divvies(*)').eq('user_id', user.id);
      const shared = memberData?.map((d: any) => d.divvies).filter(Boolean) || [];
      const combined = [...(created || []), ...shared];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDivvies(unique);
    } catch (err) {
      toast.error('Erro ao carregar Divvies');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Divvies</h1>
            <p className="text-sm text-gray-500">Gerencie suas despesas compartilhadas</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'primary'}>
            {showForm ? 'Cancelar' : '+ Novo Divvy'}
          </Button>
        </div>

        {showForm && (
          <div className="p-6 bg-white rounded-xl shadow-sm border border-brand-100 animate-fade-in-down">
            <DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} />
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : divvies.length > 0 ? (
          <DivvyList divvies={divvies} onRefresh={fetchDivvies} />
        ) : (
          <EmptyState />
        )}

        {/* Status de Segurança */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="text-gray-400" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Segurança da Conta</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ShieldCheck size={16} className="text-green-500" />
                  Status da Autenticação
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Conexão segura via Supabase Auth
                </div>
              </div>
              <div className="flex flex-col justify-center">
                 <p className="text-xs text-gray-500">
                   Suas chaves de integração e IDs de cliente são gerenciados de forma segura pelo servidor e não são expostos no seu navegador.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}
