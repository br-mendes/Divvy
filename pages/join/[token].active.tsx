
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
      
      // Usa RPC 'get_invite_info' para contornar limitações de RLS para leitura pública
      const { data, error } = await supabase.rpc('get_invite_info', {
        p_token: token
      });

      if (error) throw error;
      
      // supabase.rpc retorna array de linhas
      const info = data && data[0];

      if (!info) {
        throw new Error('Convite não encontrado ou inválido.');
      }

      if (info.is_expired) {
        throw new Error('Este convite expirou.');
      }

      if (info.status !== 'pending') {
        throw new Error('Este convite já foi aceito ou recusado.');
      }

      setInviteData(info);
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
      // Usa RPC 'accept_divvy_invite' para processar a lógica no banco
      const { data: success, error } = await supabase.rpc('accept_divvy_invite', {
        p_token: token,
        p_user_id: user.id,
        p_user_email: user.email!
      });

      if (error) throw error;

      if (success) {
        toast.success(`Você entrou em ${inviteData.divvy_name}!`);
        router.push(`/divvy/${inviteData.divvy_id}`);
      } else {
        throw new Error("Não foi possível aceitar o convite. Ele pode ter expirado ou ser inválido.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao aceitar convite.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/">
            <Button variant="primary">Ir para Início</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="text-5xl mb-6">📩</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite para Divvy</h1>
        <p className="text-gray-600 mb-6">
          Você foi convidado por <strong>{inviteData?.inviter_name}</strong> para participar do grupo de despesas <strong>{inviteData?.divvy_name}</strong>.
        </p>

        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
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
