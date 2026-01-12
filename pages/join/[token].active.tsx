
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function JoinDivvy() {
  const router = useRouter();
  const { token } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [inviteData, setInviteData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && typeof token === 'string') {
      fetchInviteDetails(token);
    }
  }, [token]);

  const fetchInviteDetails = async (inviteId: string) => {
    try {
      setLoading(true);
      
      // Busca direta na tabela, confiando nas regras RLS (SELECT USING true)
      const { data, error } = await supabase
        .from('divvyinvites')
        .select(`
          *,
          divvies ( name ),
          userprofiles:invitedbyuserid ( fullname, displayname )
        `)
        .eq('id', inviteId)
        .single();

      if (error || !data) {
        throw new Error('Convite não encontrado ou inválido.');
      }

      // Validações de frontend (também feitas na API, mas boas para UX)
      if (data.status !== 'pending') {
        throw new Error('Este convite já foi utilizado.');
      }

      const expires = new Date(data.expiresat);
      if (expires < new Date()) {
        throw new Error('Este convite expirou.');
      }

      setInviteData({
        id: data.id,
        divvy_name: (data.divvies as any)?.name || 'Grupo sem nome',
        divvy_id: data.divvyid,
        inviter_name: (data.userprofiles as any)?.displayname || (data.userprofiles as any)?.fullname || 'Alguém',
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
      // Usa a API Route segura para processar a aceitação
      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteToken: token,
          userId: user.id,
          userEmail: user.email
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao aceitar convite');
      }

      toast.success(`Você entrou em ${inviteData.divvy_name}!`);
      router.push(`/divvy/${result.divvyId}`);
      
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
        <div className="max-w-md w-full bg-white dark:bg-dark-900 p-8 rounded-2xl shadow-lg text-center border border-gray-100 dark:border-dark-800">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Convite Inválido</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{error}</p>
          <Link href="/dashboard">
            <Button variant="primary" fullWidth>Ir para meu Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 px-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-dark-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-800 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <span className="text-4xl">📩</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Convite para Grupo</h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            <strong>{inviteData?.inviter_name}</strong> convidou você para participar do grupo <strong className="text-brand-600 dark:text-brand-400">{inviteData?.divvy_name}</strong> no Divvy.
          </p>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl flex items-center gap-3 border border-gray-100 dark:border-dark-700">
               <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold">
                  {user.email?.charAt(0).toUpperCase()}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Entrando como</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.email}</p>
               </div>
               <CheckCircle className="text-green-500" size={20} />
            </div>

            <Button 
              variant="primary" 
              fullWidth 
              size="lg"
              onClick={handleAccept}
              isLoading={processing}
              className="shadow-lg shadow-brand-500/20"
            >
              Aceitar e Entrar
            </Button>
            
            <Link href="/dashboard" className="block">
              <Button variant="ghost" fullWidth disabled={processing}>
                Recusar / Voltar
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl text-sm text-yellow-800 dark:text-yellow-200 mb-4">
               Você precisa estar logado para aceitar este convite.
            </div>
            
            <Link href={`/login?redirect=${encodeURIComponent(`/join/${token}`)}`}>
              <Button variant="primary" fullWidth size="lg">
                Fazer Login
              </Button>
            </Link>
            <Link href={`/signup?redirect=${encodeURIComponent(`/join/${token}`)}`}>
              <Button variant="outline" fullWidth size="lg">
                Criar Nova Conta
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
