"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import StaticPageLinks from '../../components/common/StaticPageLinks';

export default function JoinDivvy() {
  const router = useRouter();
  const params = useParams();
  const tokenParam = params.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
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

      const { data, error } = await supabase.rpc('get_invite_details', {
        invite_token: inviteId,
      });

      if (error) throw error;

      const info = data && data[0];

      if (!info) {
        throw new Error('Convite não encontrado ou inválido.');
      }

      if (info.status !== 'pending') {
        throw new Error('Este convite já foi utilizado ou cancelado.');
      }

      if (info.is_expired) {
        throw new Error('Este convite expirou.');
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
      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteToken: token,
          userId: user.id,
          userEmail: user.email,
        }),
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

  const currentPath = `/join/${token}`;
  const redirectParam = encodeURIComponent(currentPath);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 px-4 transition-colors">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-dark-900 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-dark-800 animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-800/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner transform rotate-3">
               <span className="text-4xl filter drop-shadow-md">📩</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Você foi convidado!</h1>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              <strong className="text-gray-900 dark:text-white">{inviteData?.inviter_name}</strong> quer que você participe do grupo <br/>
              <span className="text-brand-600 dark:text-brand-400 font-black text-lg block mt-1">{inviteData?.divvy_name}</span>
            </p>
          </div>

        {user ? (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-xl flex items-center gap-3 border border-gray-200 dark:border-dark-700">
              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
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
              className="shadow-lg shadow-brand-500/20 h-12 text-base"
            >
              Aceitar Convite <ArrowRight size={18} className="ml-2" />
            </Button>

            <Link href="/dashboard" className="block">
              <Button variant="ghost" fullWidth disabled={processing} className="text-gray-500">
                Cancelar
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-sm text-blue-800 dark:text-blue-200 mb-6 text-center">
              Para entrar no grupo, você precisa acessar sua conta.
            </div>

            <Link href={`/login?redirect=${redirectParam}`}>
              <Button variant="primary" fullWidth size="lg" className="h-12 text-base shadow-lg shadow-brand-500/20">
                <LogIn size={18} className="mr-2" /> Fazer Login
              </Button>
            </Link>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-dark-700"></div></div>
              <div className="relative flex justify-center text-xs text-gray-400 uppercase"><span className="bg-white dark:bg-dark-900 px-2">Ou</span></div>
            </div>

            <Link href={`/signup?redirect=${redirectParam}`}>
              <Button variant="outline" fullWidth size="lg" className="h-12 text-base">
                <UserPlus size={18} className="mr-2" /> Criar Conta Grátis
              </Button>
            </Link>
          </div>
        )}
        </div>
        <div className="mt-6">
          <StaticPageLinks className="text-xs text-gray-500 dark:text-gray-400" linkClassName="hover:text-brand-600 dark:hover:text-brand-400" />
        </div>
      </div>
    </div>
  );
}
