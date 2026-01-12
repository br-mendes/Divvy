
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function JoinDivvy() {
  const router = useRouter();
  const { token } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [inviteData, setInviteData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInviteDetails();
    }
  }, [token]);

  const fetchInviteDetails = async () => {
    try {
      setLoading(true);
      // Ainda usamos RPC ou leitura direta para 'view', se RLS permitir leitura pública de convites pendentes
      const { data, error } = await supabase.from('divvyinvites').select('*, divvies(name), userprofiles:invitedbyuserid(fullname)').eq('id', token).single();

      if (error || !data) {
        throw new Error('Convite não encontrado ou inválido.');
      }

      if (data.status !== 'pending') {
        throw new Error('Este convite já foi utilizado.');
      }

      setInviteData({
        divvy_name: (data.divvies as any)?.name,
        divvy_id: data.divvyid,
        inviter_name: (data.userprofiles as any)?.fullname || 'Alguém',
      });
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar convite.');
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !inviteData) return;
    setProcessing(true);

    try {
      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteToken: token,
          userId: user.id,
          userEmail: user.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aceitar convite');
      }

      toast.success(`Você entrou em ${inviteData.divvy_name}!`);
      router.push(`/divvy/${data.divvyId}`);
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao aceitar convite.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-dark-900 p-8 rounded-lg shadow-md text-center border border-gray-200 dark:border-dark-800">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ops! Algo deu errado.</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link href="/">
            <Button variant="primary">Ir para Início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-900 p-8 rounded-lg shadow-md text-center border border-gray-200 dark:border-dark-800">
        <div className="text-5xl mb-6">📩</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Convite para Divvy</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Você foi convidado por <strong>{inviteData?.inviter_name}</strong> para participar do grupo <strong>{inviteData?.divvy_name}</strong>.
        </p>

        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Entrar como <strong>{user.email}</strong>
            </p>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleAccept}
              isLoading={processing}
            >
              Aceitar Convite
            </Button>
            <Link href="/dashboard" className="block mt-2">
              <Button variant="outline" fullWidth disabled={processing}>
                Cancelar
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Faça login ou crie uma conta para aceitar.
            </p>
            <Link href={`/login?redirect=${encodeURIComponent(`/join/${token}`)}`}>
              <Button variant="primary" fullWidth>
                Fazer Login
              </Button>
            </Link>
            <Link href={`/signup?redirect=${encodeURIComponent(`/join/${token}`)}`}>
              <Button variant="outline" fullWidth>
                Criar Conta
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
