import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Divvy } from '../types';
import { Button } from '../components/ui/Button';
import DivvyList from '../components/divvy/DivvyList';
import DivvyForm from '../components/divvy/DivvyForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import toast, { Toaster } from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [divvies, setDivvies] = useState<Divvy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchDivvies();
    }
  }, [user, authLoading, navigate]);

  async function fetchDivvies() {
    try {
      if (!user) return;
      
      // Fetching both created by user and where user is a member
      const { data: createdDivvies, error: createdError } = await supabase
        .from('divvies')
        .select('*')
        .eq('creator_id', user.id);

      if (createdError) throw createdError;

      const { data: memberDivvies, error: memberError } = await supabase
        .from('divvy_members')
        .select('divvies(*)')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Extract and merge
      const sharedDivvies = memberDivvies?.map((d: any) => d.divvies).filter(Boolean) || [];
      const allDivvies = [...(createdDivvies || []), ...sharedDivvies];
      
      // Deduplicate by ID
      const uniqueDivvies = Array.from(new Map(allDivvies.map(item => [item.id, item])).values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setDivvies(uniqueDivvies);
    } catch (err) {
      toast.error('Erro ao carregar Divvies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleCreateDivvy() {
    setShowForm(false);
    fetchDivvies();
    toast.success('Divvy criado com sucesso!');
  }

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bem-vindo, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie suas despesas compartilhadas
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancelar' : '+ Novo Divvy'}
          </Button>
        </div>

        {showForm && (
          <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-fade-in-down">
            <DivvyForm onSuccess={handleCreateDivvy} />
          </div>
        )}

        <div>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : divvies.length > 0 ? (
            <DivvyList divvies={divvies} onRefresh={fetchDivvies} />
          ) : (
            <div className="flex flex-col items-center">
              <EmptyState 
                message="Nenhum Divvy ainda" 
                description="Crie seu primeiro Divvy para começar a organizar despesas com amigos, família ou viagens."
              />
              <div className="mt-4">
                <Button
                  variant="primary"
                  onClick={() => setShowForm(true)}
                >
                  Criar primeiro Divvy
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};