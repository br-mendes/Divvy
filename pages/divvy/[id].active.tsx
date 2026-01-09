import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Divvy, DivvyMember, Expense } from '../../types';
import DivvyHeader from '../../components/divvy/DivvyHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ProtectedRoute } from '../../components/ProtectedRoute';

const DivvyDetailContent: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [divvy, setDivvy] = useState<Divvy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) fetchDivvy();
  }, [id, user]);

  async function fetchDivvy() {
    const { data } = await supabase.from('divvies').select('*').eq('id', id).single();
    setDivvy(data);
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;
  if (!divvy) return <div>Não encontrado</div>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <DivvyHeader divvy={divvy} />
      <div className="mt-8 text-center text-gray-500">Funcionalidades de despesas em breve nesta nova rota.</div>
    </div>
  );
};

export default function DivvyDetail() {
  return <ProtectedRoute><DivvyDetailContent /></ProtectedRoute>;
}