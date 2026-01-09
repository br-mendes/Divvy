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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Meus Divvies</h1>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Novo'}</Button>
        </div>
        {showForm && <div className="mb-8 p-6 bg-white rounded-lg shadow-sm"><DivvyForm onSuccess={() => { setShowForm(false); fetchDivvies(); }} /></div>}
        {loading ? <LoadingSpinner /> : divvies.length > 0 ? <DivvyList divvies={divvies} onRefresh={fetchDivvies} /> : <EmptyState />}
      </div>
    </div>
  );
};

export default function Dashboard() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}